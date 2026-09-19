import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { EncuestasService } from '../../../../../services/shared/encuestas.service';
import { EncuestaEmpresaService } from '../../../../../services/shared/encuesta-empresa.service';
import { AuthenticacionService } from '../../../../../services/shared/authenticacion.service';
import { EmpresaService } from '../../../../../services/shared/empresa.service';
import { RolUsuarioService } from '../../../../../services/shared/rol-usuario.service';
import { AlertaService } from '../../../../../services/shared/alerta.service';
import { ModelsEncuestas } from '../../../../../interfaces/encuestas.interface';

/**
 * Administrar la encuesta del periodo.
 *
 * Aquí el líder del PESV elige qué cuestionario usa este año, qué módulos
 * pregunta y cuándo abre el enlace público. Al activarlo se guarda una copia
 * entera del cuestionario bajo la empresa: a partir de ahí es suyo, y lo que el
 * administrador haga en el catálogo ya no le afecta.
 */
@Component({
  selector: 'app-encuesta-parametros',
  standalone: true,
  imports: [CommonModule, RouterLink],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './encuesta-parametros.component.html',
})
export class EncuestaParametrosComponent implements OnInit {

  private _catalogo = inject(EncuestasService);
  private _empresaEncuesta = inject(EncuestaEmpresaService);
  private _auth = inject(AuthenticacionService);
  private _empresa = inject(EmpresaService);
  private _rol = inject(RolUsuarioService);
  private _alerta = inject(AlertaService);

  readonly nitEmpresa = this._empresa.nit;
  readonly periodo = this._auth.periodo;

  /** Solo el operativo administra la encuesta; el supervisor la consulta. */
  get editable(): boolean { return this._rol.editable(); }

  cargando = signal(true);
  guardando = signal(false);

  /** Encuestas publicadas del catálogo, entre las que se elige. */
  disponibles = signal<ModelsEncuestas.Encuesta[]>([]);

  /** La copia activa de este periodo, si ya se activó alguna. */
  activa = signal<ModelsEncuestas.EncuestaActiva | null>(null);

  /** Respuestas ya recogidas en el periodo. A partir de una, todo queda fijo. */
  respuestas = signal(0);

  /** Cuál se eligió en el desplegable, antes de activarla. */
  seleccionada = signal<string>('');

  /**
   * El cuestionario ya no se puede cambiar.
   *
   * Cambiarlo a mitad de la recogida dejaría unas respuestas contestando a
   * unas preguntas y otras a otras, y el diagnóstico no cuadraría consigo
   * mismo.
   */
  readonly fijada = computed(() => this.respuestas() > 0);

  /** Hay una versión más reciente de la encuesta que esta empresa activó. */
  readonly hayVersionNueva = computed(() => {
    const copia = this.activa();
    if (!copia) return false;
    const enCatalogo = this.disponibles().find(e => e.id === copia.encuestaId);
    return !!enCatalogo && enCatalogo.version > copia.version;
  });

  async ngOnInit() {
    await this.cargar();
  }

  async cargar() {
    this.cargando.set(true);
    try {
      const [catalogo, activa] = await Promise.all([
        this._catalogo.listar(),
        this._empresaEncuesta.activa(),
      ]);

      this.disponibles.set(catalogo.filter(e => e.estado === 'publicada'));
      this.activa.set(activa);
      this.seleccionada.set(activa?.encuestaId ?? this.disponibles()[0]?.id ?? '');
      this.respuestas.set(await this._empresaEncuesta.contarRespuestas(this.periodo()));
    } catch (error: unknown) {
      console.error('[EncuestaParametros] cargar:', error);
      this._alerta.showError('No se pudo cargar la configuración de la encuesta.');
    } finally {
      this.cargando.set(false);
    }
  }

  /**
   * Deja la encuesta elegida como cuestionario del periodo.
   *
   * Arranca con todos los módulos activos: es lo que pide la norma, y quitar
   * lo que no aplique es más fácil que acordarse de añadir lo que falta.
   */
  async activar() {
    const encuesta = this.disponibles().find(e => e.id === this.seleccionada());
    if (!encuesta || !this.editable) return;

    this.guardando.set(true);
    try {
      await this._empresaEncuesta.activar(encuesta, encuesta.modulos.map(m => m.id));
      this._alerta.showSuccess(`"${encuesta.nombre}" activada para ${this.periodo()}.`);
      await this.cargar();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'No se pudo activar la encuesta';
      console.error('[EncuestaParametros] activar:', error);
      this._alerta.showError(msg);
    } finally {
      this.guardando.set(false);
    }
  }

  /** Un módulo entra o sale del cuestionario. Los fijos no se tocan. */
  async alternarModulo(modulo: ModelsEncuestas.Modulo) {
    const copia = this.activa();
    if (!copia || modulo.fijo || !this.editable) return;

    const activos = copia.modulosActivos.includes(modulo.id)
      ? copia.modulosActivos.filter(id => id !== modulo.id)
      : [...copia.modulosActivos, modulo.id];

    await this.guardar({ modulosActivos: activos });
  }

  estaActivo(modulo: ModelsEncuestas.Modulo): boolean {
    return modulo.fijo || (this.activa()?.modulosActivos.includes(modulo.id) ?? false);
  }

  /** Abre o cierra el enlace público. Esto sí se puede hacer en cualquier momento. */
  async alternarPublicacion() {
    const copia = this.activa();
    if (!copia || !this.editable) return;
    await this.guardar({ mostrarEncuesta: !copia.mostrarEncuesta });
  }

  private async guardar(cambios: Partial<ModelsEncuestas.EncuestaActiva>) {
    this.guardando.set(true);
    try {
      await this._empresaEncuesta.ajustar(cambios);
      await this.cargar();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'No se pudo guardar';
      console.error('[EncuestaParametros] guardar:', error);
      this._alerta.showError(msg);
    } finally {
      this.guardando.set(false);
    }
  }

  /** Cuántas preguntas se van a hacer de verdad, contando solo lo activo. */
  preguntasActivas(): number {
    const copia = this.activa();
    if (!copia) return 0;
    return copia.modulos
      .filter(m => this.estaActivo(m))
      .reduce((n, m) => n + m.preguntas.length, 0);
  }
}
