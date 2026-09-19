import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { EncuestasService } from '../../../../services/shared/encuestas.service';
import { AuthenticacionService } from '../../../../services/shared/authenticacion.service';
import { ModelsEncuestas } from '../../../../interfaces/encuestas.interface';
import { RUTA_LOGIN } from '../../../../guards/auth.guard';

/** Cómo se llama cada tipo de pregunta en la interfaz. */
export const NOMBRE_TIPO: Record<ModelsEncuestas.TipoPregunta, string> = {
  texto: 'Texto corto',
  textoLargo: 'Texto largo',
  numero: 'Número',
  fecha: 'Fecha',
  email: 'Correo',
  telefono: 'Teléfono',
  unica: 'Una sola opción',
  multiple: 'Varias opciones',
};

/** Los tipos que llevan lista de opciones. */
const CON_OPCIONES: ModelsEncuestas.TipoPregunta[] = ['unica', 'multiple'];

/**
 * Gestor de encuestas del diagnóstico.
 *
 * Las preguntas las fija la Resolución, pero la norma cambia. Antes cada
 * cambio exigía tocar un FormGroup de 57 controles y una plantilla de 1.642
 * líneas; desde aquí se editan como datos y el formulario público se construye
 * leyéndolos.
 */
@Component({
  selector: 'app-gestor-encuestas',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './gestor-encuestas.component.html',
})
export class GestorEncuestasComponent implements OnInit {

  private _encuestas = inject(EncuestasService);
  private _auth = inject(AuthenticacionService);
  private _router = inject(Router);

  readonly correo = this._auth.getCurrentUser()?.email ?? '';
  readonly tipos = Object.keys(NOMBRE_TIPO) as ModelsEncuestas.TipoPregunta[];
  readonly nombreTipo = NOMBRE_TIPO;

  lista = signal<ModelsEncuestas.Encuesta[]>([]);
  cargando = signal(true);
  guardando = signal(false);
  error = signal('');
  aviso = signal('');

  /** La encuesta abierta en el editor. Se trabaja sobre una copia. */
  edicion = signal<ModelsEncuestas.Encuesta | null>(null);

  /** `id` de los módulos desplegados en el editor. */
  desplegados = signal<Set<string>>(new Set());

  /**
   * Identificadores que ya estaban guardados al abrir la encuesta.
   *
   * Son las claves bajo las que hay respuestas recogidas. Cambiar una no
   * estropea esas respuestas, pero las deja huérfanas: siguen en Firestore con
   * la clave vieja mientras la pantalla de resultados busca la nueva, así que
   * se leen como si nadie hubiera contestado. Por eso se bloquean.
   */
  private idsGuardados = signal<Set<string>>(new Set());

  readonly hayEncuestas = computed(() => this.lista().length > 0);

  ngOnInit(): void {
    this.cargar();
  }

  async salir() {
    try {
      await this._auth.logout();
    } catch (error: unknown) {
      console.error('[GestorEncuestas] logout:', error);
    }
    this._router.navigate([RUTA_LOGIN]);
  }

  async cargar() {
    this.cargando.set(true);
    this.error.set('');
    try {
      this.lista.set(await this._encuestas.listar());
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'No se pudieron cargar las encuestas';
      console.error('[GestorEncuestas] listar:', error);
      this.error.set(msg);
    } finally {
      this.cargando.set(false);
    }
  }

  /** Trae a Firestore la encuesta de la Resolución que vivía en el código. */
  async traerBase() {
    await this.conAviso(async () => {
      const sembrada = await this._encuestas.sembrarBase();
      return sembrada
        ? 'Encuesta de la Resolución cargada. Ya puedes editarla.'
        : 'Ya hay encuestas: no se volvió a cargar para no duplicarla.';
    });
  }

  async duplicar(encuesta: ModelsEncuestas.Encuesta) {
    await this.conAviso(async () => {
      await this._encuestas.duplicar(encuesta.id);
      return `Copia de "${encuesta.nombre}" creada como borrador.`;
    });
  }

  // ── Editor ────────────────────────────────────────────────────────────────

  /**
   * Abre una copia propia. Sin copiar, cada tecleo modificaría el objeto de la
   * lista y cancelar no podría deshacer nada.
   */
  abrir(encuesta: ModelsEncuestas.Encuesta) {
    this.edicion.set(structuredClone(encuesta));
    this.idsGuardados.set(this.recogerIds(encuesta));
    this.desplegados.set(new Set());
    this.aviso.set('');
  }

  private recogerIds(encuesta: ModelsEncuestas.Encuesta): Set<string> {
    return new Set(encuesta.modulos.flatMap(m => m.preguntas.map(p => p.id)));
  }

  /** La pregunta ya se guardó alguna vez, así que puede tener respuestas. */
  idBloqueado(pregunta: ModelsEncuestas.Pregunta): boolean {
    return this.idsGuardados().has(pregunta.id);
  }

  /**
   * Convierte un enunciado en un identificador legible.
   *
   * Sin tildes ni signos y en minúsculas por seguridad: es una clave de
   * Firestore y acaba escrita en exportaciones y en el mapeo a la ficha de
   * colaborador, donde los caracteres raros dan problemas.
   */
  private aIdentificador(texto: string): string {
    const limpio = texto
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-zA-Z0-9\s]/g, ' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 6);

    if (!limpio.length) return '';
    return limpio
      .map((palabra, i) => i === 0
        ? palabra.toLowerCase()
        : palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase())
      .join('');
  }

  /** Añade un sufijo si el identificador ya lo usa otra pregunta. */
  private idLibre(base: string, pregunta: ModelsEncuestas.Pregunta): string {
    const encuesta = this.edicion();
    if (!encuesta || !base) return base;

    const ocupados = new Set(
      encuesta.modulos
        .flatMap(m => m.preguntas)
        .filter(p => p !== pregunta)
        .map(p => p.id)
    );

    if (!ocupados.has(base)) return base;
    let n = 2;
    while (ocupados.has(`${base}${n}`)) n++;
    return `${base}${n}`;
  }

  /**
   * Mientras la pregunta sea nueva, su identificador sigue al enunciado. Así
   * nadie tiene que inventarse una clave, que es una tripa del sistema y no
   * una decisión de quien redacta la encuesta.
   */
  alEscribirEnunciado(pregunta: ModelsEncuestas.Pregunta) {
    if (this.idBloqueado(pregunta)) return;
    const base = this.aIdentificador(pregunta.etiqueta);
    pregunta.id = base ? this.idLibre(base, pregunta) : pregunta.id;
  }

  cerrar() {
    this.edicion.set(null);
  }

  alternarModulo(id: string) {
    const abiertos = new Set(this.desplegados());
    if (abiertos.has(id)) {
      abiertos.delete(id);
    } else {
      abiertos.add(id);
    }
    this.desplegados.set(abiertos);
  }

  estaDesplegado(id: string): boolean {
    return this.desplegados().has(id);
  }

  /** El tipo lleva lista de opciones que el encuestado elige. */
  llevaOpciones(pregunta: ModelsEncuestas.Pregunta): boolean {
    return CON_OPCIONES.includes(pregunta.tipo);
  }

  /**
   * Al pasar a un tipo con opciones se estrena la lista, y al salir de él se
   * retira: unas opciones colgando de un campo de texto no se ven en ningún
   * sitio y reaparecerían al volver a cambiar el tipo.
   */
  alCambiarTipo(pregunta: ModelsEncuestas.Pregunta) {
    if (this.llevaOpciones(pregunta)) {
      pregunta.opciones = pregunta.opciones?.length ? pregunta.opciones : [{ valor: '', etiqueta: '' }];
    } else {
      delete pregunta.opciones;
    }
  }

  anadirOpcion(pregunta: ModelsEncuestas.Pregunta) {
    pregunta.opciones = [...(pregunta.opciones ?? []), { valor: '', etiqueta: '' }];
  }

  quitarOpcion(pregunta: ModelsEncuestas.Pregunta, indice: number) {
    pregunta.opciones = (pregunta.opciones ?? []).filter((_, i) => i !== indice);
  }

  /** El valor guardado se rellena con la etiqueta si nadie lo toca. */
  alEscribirEtiquetaOpcion(opcion: ModelsEncuestas.Opcion, anterior: string) {
    if (!opcion.valor || opcion.valor === anterior) opcion.valor = opcion.etiqueta;
  }

  anadirPregunta(modulo: ModelsEncuestas.Modulo) {
    modulo.preguntas = [...modulo.preguntas, {
      id: `pregunta_${Date.now()}`,
      etiqueta: '',
      tipo: 'texto',
      obligatoria: false,
    }];
  }

  /**
   * Pregunta pendiente de confirmar su borrado.
   *
   * Solo se pide confirmación para las que ya se guardaron: borrar una de esas
   * deja sus respuestas en Firestore sin nada que las lea, y no hay forma de
   * recuperarlas desde la interfaz. Las recién añadidas se quitan sin más.
   */
  borradoPendiente = signal<string | null>(null);

  pedirBorrado(modulo: ModelsEncuestas.Modulo, indice: number) {
    const pregunta = modulo.preguntas[indice];
    if (this.idBloqueado(pregunta)) {
      this.borradoPendiente.set(pregunta.id);
      return;
    }
    this.quitarPregunta(modulo, indice);
  }

  cancelarBorrado() {
    this.borradoPendiente.set(null);
  }

  quitarPregunta(modulo: ModelsEncuestas.Modulo, indice: number) {
    modulo.preguntas = modulo.preguntas.filter((_, i) => i !== indice);
    this.borradoPendiente.set(null);
  }

  moverPregunta(modulo: ModelsEncuestas.Modulo, indice: number, salto: number) {
    const destino = indice + salto;
    if (destino < 0 || destino >= modulo.preguntas.length) return;
    const copia = [...modulo.preguntas];
    [copia[indice], copia[destino]] = [copia[destino], copia[indice]];
    modulo.preguntas = copia;
  }

  anadirModulo() {
    const encuesta = this.edicion();
    if (!encuesta) return;
    encuesta.modulos = [...encuesta.modulos, {
      id: `modulo_${Date.now()}`,
      titulo: 'Módulo nuevo',
      fijo: false,
      preguntas: [],
    }];
    this.edicion.set({ ...encuesta });
  }

  quitarModulo(indice: number) {
    const encuesta = this.edicion();
    if (!encuesta) return;
    encuesta.modulos = encuesta.modulos.filter((_, i) => i !== indice);
    this.edicion.set({ ...encuesta });
  }

  /** Cuántas preguntas tiene una encuesta, sumando sus módulos. */
  totalPreguntas(encuesta: ModelsEncuestas.Encuesta): number {
    return encuesta.modulos.reduce((n, m) => n + m.preguntas.length, 0);
  }

  /**
   * Lo que impide guardar. Se avisa antes de escribir porque una encuesta a
   * medias se sirve igual al público.
   */
  problemas(): string[] {
    const encuesta = this.edicion();
    if (!encuesta) return [];

    const fallos: string[] = [];
    if (!encuesta.nombre.trim()) fallos.push('La encuesta necesita un nombre.');

    const vistos = new Set<string>();
    for (const modulo of encuesta.modulos) {
      if (!modulo.titulo.trim()) fallos.push('Hay un módulo sin título.');

      for (const pregunta of modulo.preguntas) {
        if (!pregunta.etiqueta.trim()) {
          fallos.push(`"${modulo.titulo}": hay una pregunta sin enunciado.`);
        }
        // El id es la clave con la que se guarda la respuesta: repetirlo haria
        // que una pregunta pisara la respuesta de otra.
        if (vistos.has(pregunta.id)) {
          fallos.push(`El identificador "${pregunta.id}" está repetido.`);
        }
        vistos.add(pregunta.id);

        if (this.llevaOpciones(pregunta) && !(pregunta.opciones ?? []).some(o => o.etiqueta.trim())) {
          fallos.push(`"${pregunta.etiqueta || pregunta.id}" no tiene opciones.`);
        }
      }
    }
    return [...new Set(fallos)];
  }

  async guardar(publicar = false) {
    const encuesta = this.edicion();
    if (!encuesta) return;

    const fallos = this.problemas();
    if (fallos.length) {
      this.error.set(fallos[0]);
      return;
    }

    this.guardando.set(true);
    this.error.set('');
    try {
      const { id, docCreado, docActualizado, ...datos } = encuesta;
      await this._encuestas.actualizar(
        id,
        publicar ? { ...datos, estado: 'publicada' } : datos,
        publicar
      );
      this.aviso.set(publicar ? 'Encuesta publicada.' : 'Cambios guardados.');
      await this.cargar();
      const refrescada = this.lista().find(e => e.id === id);
      if (refrescada) {
        this.edicion.set(structuredClone(refrescada));
        // Lo recién guardado ya puede recibir respuestas: su identificador
        // queda fijado a partir de ahora.
        this.idsGuardados.set(this.recogerIds(refrescada));
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'No se pudo guardar';
      console.error('[GestorEncuestas] guardar:', error);
      this.error.set(msg);
    } finally {
      this.guardando.set(false);
    }
  }

  /** Envuelve una acción de lista con su aviso y su recarga. */
  private async conAviso(accion: () => Promise<string>) {
    this.guardando.set(true);
    this.error.set('');
    this.aviso.set('');
    try {
      this.aviso.set(await accion());
      await this.cargar();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'No se pudo completar la operación';
      console.error('[GestorEncuestas] accion:', error);
      this.error.set(msg);
    } finally {
      this.guardando.set(false);
    }
  }
}
