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

  /**
   * El catálogo cambió después de que esta empresa se llevara su copia.
   *
   * Mira dos cosas y no una. La versión sube cuando el administrador duplica
   * la encuesta, que era el camino previsto; pero también puede editar y
   * publicar la misma sin tocar el número, y entonces la copia de la empresa
   * se queda atrás en silencio. Comparar además la fecha de la última
   * modificación del catálogo con la de activación recoge ese caso.
   */
  readonly hayCambios = computed(() => {
    const copia = this.activa();
    if (!copia) return false;

    const enCatalogo = this.disponibles().find(e => e.id === copia.encuestaId);
    if (!enCatalogo) return false;

    if (enCatalogo.version > copia.version) return true;

    const tocado = this.enMilisegundos(enCatalogo.docActualizado);
    const copiado = copia.fechaActivacion ? Date.parse(copia.fechaActivacion) : 0;

    return !!tocado && !!copiado && tocado > copiado;
  });

  /**
   * Una fecha de Firestore en milisegundos, venga como venga.
   *
   * Sale marca de tiempo del servidor, pero tras una escritura reciente puede
   * llegar nula, y de un documento antiguo puede venir como texto. Sin esto,
   * un `undefined` se compara como cero y el aviso no aparece nunca.
   */
  private enMilisegundos(valor: unknown): number {
    if (!valor) return 0;
    const marca = valor as { toMillis?: () => number; seconds?: number };
    if (typeof marca.toMillis === 'function') return marca.toMillis();
    if (typeof marca.seconds === 'number') return marca.seconds * 1000;
    if (typeof valor === 'string') return Date.parse(valor) || 0;
    return 0;
  }

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

  // ── Vista previa ──────────────────────────────────────────────────────

  /**
   * Enseña el cuestionario tal como lo verá quien responda.
   *
   * Hace falta porque el enlace público solo sirve con la encuesta abierta, y
   * el momento en que uno quiere ver cómo va quedando es justo el anterior:
   * mientras decide qué módulos deja puestos y todavía no la ha abierto.
   *
   * Se pinta desde la copia ya cargada, sin ir a ningún sitio ni exponer nada.
   */
  vistaPrevia = signal(false);

  /** Los módulos que se van a preguntar, en el orden en que se preguntan. */
  readonly modulosVisibles = computed(() =>
    (this.activa()?.modulos ?? []).filter(m => this.estaActivo(m))
  );

  /**
   * Con qué control se pinta cada pregunta.
   *
   * La vista previa no valida ni guarda nada, así que solo necesita saber si
   * va como lista de opciones o como campo de escritura.
   */
  esDeOpciones(pregunta: ModelsEncuestas.Pregunta): boolean {
    return pregunta.tipo === 'unica' || pregunta.tipo === 'multiple';
  }

  /** El texto del marcador de un campo, según lo que pida. */
  marcador(pregunta: ModelsEncuestas.Pregunta): string {
    switch (pregunta.tipo) {
      case 'textoLargo': return 'Respuesta larga...';
      case 'numero': return '0';
      case 'fecha': return 'dd/mm/aaaa';
      case 'email': return 'nombre@empresa.com';
      case 'telefono': return '300 000 0000';
      default: return 'Respuesta corta...';
    }
  }

  /**
   * Qué hace falta contestar antes para que aparezca esta pregunta.
   *
   * Se enseña porque en la vista previa salen todas seguidas, y sin la
   * aclaración parece que se le van a preguntar cosas a quien nunca las verá:
   * a alguien que no conduce no se le pide la licencia.
   */
  condicionDe(pregunta: ModelsEncuestas.Pregunta): string {
    const condicion = pregunta.condicion;
    if (!condicion) return '';

    const dueña = (this.activa()?.modulos ?? [])
      .flatMap(m => m.preguntas)
      .find(p => p.id === condicion.pregunta);

    const enunciado = dueña?.etiqueta ?? condicion.pregunta;
    return `Solo si en "${enunciado}" responde: ${condicion.valores.join(' o ')}`;
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
