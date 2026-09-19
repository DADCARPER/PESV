import { Component, CUSTOM_ELEMENTS_SCHEMA, Input, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { EncuestaEmpresaService } from '../../../../../services/shared/encuesta-empresa.service';
import { AuthenticacionService } from '../../../../../services/shared/authenticacion.service';
import { AlertaService } from '../../../../../services/shared/alerta.service';
import { ModelsEncuestas } from '../../../../../interfaces/encuestas.interface';

/** Cuántas columnas de identificación acompañan a las del módulo. */
const IDENTIFICACION = 3;

/**
 * Las respuestas de un módulo de la encuesta, en tabla.
 *
 * Sirve para cualquier módulo: salud, conducción, desplazamientos, riesgos. Las
 * columnas son sus preguntas, leídas del cuestionario que la empresa activó, y
 * delante van unas pocas de identificación para saber de quién es cada fila.
 *
 * Es solo lectura a propósito. Son las respuestas que dio una persona, no datos
 * administrativos: corregir una cédula mal tecleada tiene sentido y se hace
 * desde la Lista de Colaboradores; reescribir lo que alguien contestó sobre su
 * salud, no.
 */
@Component({
  selector: 'app-respuestas-modulo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './respuestas-modulo.component.html',
})
export class RespuestasModuloComponent {

  private _encuesta = inject(EncuestaEmpresaService);
  private _auth = inject(AuthenticacionService);
  private _alerta = inject(AlertaService);

  /** Qué módulo se lista, por su `id` en el cuestionario. */
  @Input({ required: true }) moduloId = '';

  /** Texto que se muestra cuando el módulo no está activo en el periodo. */
  @Input() nombreModulo = 'este módulo';

  readonly periodo = this._auth.periodo;

  cargando = signal(true);
  busqueda = signal('');

  /** El módulo no existe en el cuestionario o la empresa no lo activó. */
  noDisponible = signal(false);

  titulo = signal('');
  /** Preguntas de identificación, para saber de quién es cada respuesta. */
  identificacion = signal<ModelsEncuestas.Pregunta[]>([]);
  columnas = signal<ModelsEncuestas.Pregunta[]>([]);
  respuestas = signal<Record<string, any>[]>([]);

  constructor() {
    effect(() => {
      this.periodo();
      this.cargar();
    }, { allowSignalWrites: true });
  }

  async cargar() {
    this.cargando.set(true);
    this.noDisponible.set(false);
    try {
      const copia = await this._encuesta.activa();
      const modulo = copia?.modulos.find(m => m.id === this.moduloId);

      // Un modulo que la empresa no activo no se pregunto, asi que no hay
      // respuestas suyas: mejor decirlo que mostrar una tabla vacia.
      const activo = !!copia && (modulo?.fijo || copia.modulosActivos.includes(this.moduloId));

      if (!modulo || !activo) {
        this.noDisponible.set(true);
        this.columnas.set([]);
        this.respuestas.set([]);
        return;
      }

      this.titulo.set(modulo.titulo);
      this.columnas.set(modulo.preguntas);

      const personal = copia!.modulos.find(m => m.fijo);
      this.identificacion.set((personal?.preguntas ?? []).slice(0, IDENTIFICACION));

      this.respuestas.set(await this._encuesta.respuestas());
    } catch (error: unknown) {
      console.error(`[RespuestasModulo] cargar ${this.moduloId}:`, error);
      this._alerta.showError('No se pudieron cargar las respuestas.');
    } finally {
      this.cargando.set(false);
    }
  }

  /** Identificación y preguntas del módulo, en el orden en que se pintan. */
  todasLasColumnas(): ModelsEncuestas.Pregunta[] {
    return [...this.identificacion(), ...this.columnas()];
  }

  filtradas(): Record<string, any>[] {
    const texto = this.busqueda().trim().toLowerCase();
    if (!texto) return this.respuestas();

    return this.respuestas().filter(r =>
      this.todasLasColumnas().some(c => this.mostrar(r, c).toLowerCase().includes(texto))
    );
  }

  mostrar(respuesta: Record<string, any>, pregunta: ModelsEncuestas.Pregunta): string {
    const valor = respuesta[pregunta.id];
    if (valor === undefined || valor === null || valor === '') return '—';
    return Array.isArray(valor) ? valor.join(', ') : String(valor);
  }

  /**
   * Cómo se reparten las respuestas de una pregunta.
   *
   * Un resumen por encima de la tabla: en una muestra de cientos, la fila a
   * fila no dice nada y lo que interesa es cuántos contestaron cada cosa.
   */
  reparto(pregunta: ModelsEncuestas.Pregunta): { etiqueta: string; total: number; porcentaje: number }[] {
    const cuenta = new Map<string, number>();

    for (const respuesta of this.respuestas()) {
      const valor = respuesta[pregunta.id];
      if (valor === undefined || valor === null || valor === '') continue;
      for (const uno of Array.isArray(valor) ? valor : [valor]) {
        cuenta.set(String(uno), (cuenta.get(String(uno)) ?? 0) + 1);
      }
    }

    const total = this.respuestas().length || 1;
    return [...cuenta.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([etiqueta, n]) => ({
        etiqueta,
        total: n,
        porcentaje: Math.round((n / total) * 1000) / 10,
      }));
  }

  /** Solo las preguntas de opciones tienen un reparto que valga la pena. */
  resumibles(): ModelsEncuestas.Pregunta[] {
    return this.columnas().filter(p => p.tipo === 'unica' || p.tipo === 'multiple');
  }
}
