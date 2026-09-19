import { Component, CUSTOM_ELEMENTS_SCHEMA, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { EncuestaEmpresaService } from '../../../../../services/shared/encuesta-empresa.service';
import { AuthenticacionService } from '../../../../../services/shared/authenticacion.service';
import { RolUsuarioService } from '../../../../../services/shared/rol-usuario.service';
import { AlertaService } from '../../../../../services/shared/alerta.service';
import { ModelsEncuestas } from '../../../../../interfaces/encuestas.interface';

/**
 * Lista de Colaboradores: las personas que respondieron la encuesta.
 *
 * No es un registro aparte que haya que teclear. Para una empresa de dos mil
 * empleados repartidos en varios departamentos, consolidar esa lista a mano es
 * inviable, y por eso el diagnóstico se hace por muestreo: quien contesta la
 * encuesta entra aquí.
 *
 * Las columnas salen del módulo de información personal del cuestionario que la
 * empresa activó, no de una lista escrita en el código: si cambia la encuesta,
 * cambia la tabla.
 */
@Component({
  selector: 'app-colaboradores',
  standalone: true,
  imports: [CommonModule, FormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './colaboradores.component.html',
  styleUrl: './colaboradores.component.css',
})
export class ColaboradoresComponent {

  private _encuesta = inject(EncuestaEmpresaService);
  private _auth = inject(AuthenticacionService);
  private _rol = inject(RolUsuarioService);
  private _alerta = inject(AlertaService);

  readonly periodo = this._auth.periodo;

  /** El supervisor consulta; corregir y eliminar es del operativo. */
  get editable(): boolean { return this._rol.editable(); }

  cargando = signal(true);
  guardando = signal(false);

  /** Las preguntas del módulo personal, que son las columnas de la tabla. */
  columnas = signal<ModelsEncuestas.Pregunta[]>([]);

  respuestas = signal<Record<string, any>[]>([]);

  /** Ninguna encuesta activada todavía en este periodo. */
  sinEncuesta = signal(false);

  busqueda = signal('');

  /** La ficha abierta para corregir, como copia para poder cancelar. */
  edicion = signal<Record<string, any> | null>(null);

  /** La ficha pendiente de confirmar su eliminación. */
  aEliminar = signal<Record<string, any> | null>(null);

  constructor() {
    // Cada periodo tiene su cuestionario y sus respuestas: al cambiar de año
    // hay que releer las dos cosas.
    effect(() => {
      this.periodo();
      this.cargar();
    });
  }

  async cargar() {
    this.cargando.set(true);
    this.sinEncuesta.set(false);
    try {
      const modulo = await this._encuesta.moduloPersonal();

      if (!modulo) {
        this.sinEncuesta.set(true);
        this.columnas.set([]);
        this.respuestas.set([]);
        return;
      }

      this.columnas.set(modulo.preguntas);
      this.respuestas.set(await this._encuesta.respuestas());
    } catch (error: unknown) {
      console.error('[Colaboradores] cargar:', error);
      this._alerta.showError('No se pudieron cargar los colaboradores.');
    } finally {
      this.cargando.set(false);
    }
  }

  /** Filtra por cualquiera de las columnas visibles. */
  filtradas(): Record<string, any>[] {
    const texto = this.busqueda().trim().toLowerCase();
    if (!texto) return this.respuestas();

    return this.respuestas().filter(r =>
      this.columnas().some(c => this.mostrar(r, c).toLowerCase().includes(texto))
    );
  }

  /** El valor de una respuesta, listo para pintar. */
  mostrar(respuesta: Record<string, any>, pregunta: ModelsEncuestas.Pregunta): string {
    const valor = respuesta[pregunta.id];
    if (valor === undefined || valor === null || valor === '') return '—';
    return Array.isArray(valor) ? valor.join(', ') : String(valor);
  }

  // ── Corregir ──────────────────────────────────────────────────────────────

  abrirEdicion(respuesta: Record<string, any>) {
    if (!this.editable) return;
    this.edicion.set({ ...respuesta });
  }

  cerrarEdicion() { this.edicion.set(null); }

  /**
   * Guarda solo los campos del módulo personal.
   *
   * Lo demás de la respuesta —salud, conducción, percepción de riesgo— es lo
   * que la persona contestó y no se toca desde aquí: esto sirve para corregir
   * una cédula mal tecleada, no para reescribir lo que alguien respondió.
   */
  async guardarEdicion() {
    const ficha = this.edicion();
    if (!ficha || !this.editable) return;

    this.guardando.set(true);
    try {
      const cambios: Record<string, unknown> = {};
      for (const columna of this.columnas()) cambios[columna.id] = ficha[columna.id] ?? '';

      await this._encuesta.corregir(ficha['id'], cambios);
      this._alerta.showSuccess('Datos corregidos.');
      this.edicion.set(null);
      await this.cargar();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'No se pudo guardar';
      console.error('[Colaboradores] guardarEdicion:', error);
      this._alerta.showError(msg);
    } finally {
      this.guardando.set(false);
    }
  }

  /** Las opciones se pintan como desplegable; el resto, como campo de texto. */
  esLista(pregunta: ModelsEncuestas.Pregunta): boolean {
    return pregunta.tipo === 'unica' && !!pregunta.opciones?.length;
  }

  tipoCampo(pregunta: ModelsEncuestas.Pregunta): string {
    switch (pregunta.tipo) {
      case 'numero': return 'number';
      case 'fecha': return 'date';
      case 'email': return 'email';
      case 'telefono': return 'tel';
      default: return 'text';
    }
  }

  // ── Eliminar ──────────────────────────────────────────────────────────────

  pedirEliminar(respuesta: Record<string, any>) {
    if (!this.editable) return;
    this.aEliminar.set(respuesta);
  }

  cancelarEliminar() { this.aEliminar.set(null); }

  async confirmarEliminar() {
    const ficha = this.aEliminar();
    if (!ficha || !this.editable) return;

    this.guardando.set(true);
    try {
      await this._encuesta.eliminarRespuesta(ficha['id']);
      this._alerta.showSuccess('Colaborador eliminado.');
      this.aEliminar.set(null);
      await this.cargar();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'No se pudo eliminar';
      console.error('[Colaboradores] eliminar:', error);
      this._alerta.showError(msg);
    } finally {
      this.guardando.set(false);
    }
  }
}
