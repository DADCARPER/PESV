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

  readonly hayEncuestas = computed(() => this.lista().length > 0);

  /**
   * En cuantas empresas y periodos se esta usando cada encuesta.
   *
   * Es informativo, no un candado: cada empresa trabaja sobre su propia copia,
   * tomada el dia que la activo, asi que editar aqui no le cambia el
   * cuestionario a nadie. Sirve para saber el alcance de lo que se toca.
   */
  usos = signal<Record<string, number>>({});

  cuantosUsos(encuesta: ModelsEncuestas.Encuesta): number {
    return this.usos()[encuesta.id] ?? 0;
  }

  /**
   * Cuenta en cuantos periodos de empresa se usa cada encuesta, sin dejar que
   * un fallo suyo estropee la pantalla: si no se puede contar, sencillamente
   * no se muestra el dato.
   */
  private async contarUsos(encuestas: ModelsEncuestas.Encuesta[]) {
    try {
      const conteos = await Promise.all(
        encuestas.map(async (e) => [e.id, await this._encuestas.contarUsos(e.id)] as const)
      );
      this.usos.set(Object.fromEntries(conteos));
    } catch (error: unknown) {
      console.error('[GestorEncuestas] contarUsos:', error);
      this.usos.set({});
    }
  }

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
      const encuestas = await this._encuestas.listar();
      this.lista.set(encuestas);

      // Un conteo por encuesta, en paralelo. Cada uno es una consulta de
      // agregacion: no descarga nada.
      //
      // Aparte de la lista y sin tumbarla si falla: es un dato de apoyo, y su
      // consulta necesita un indice de grupo que tarda minutos en construirse
      // tras un despliegue. Sin esto, el gestor entero quedaba inutilizable
      // mientras tanto.
      this.contarUsos(encuestas);
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
    this.desplegados.set(new Set());
    this.aviso.set('');
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
   * Retira una pregunta: deja de hacerse, pero su identificador no se libera.
   *
   * No se borra nunca. Las respuestas ya recogidas se guardaron bajo esa
   * clave, y reutilizarla años después para otra pregunta mezclaría datos
   * viejos y nuevos bajo el mismo nombre sin que nada fallara ni nadie se
   * enterara. Es reversible: volver a preguntarla es un clic.
   */
  retirarPregunta(pregunta: ModelsEncuestas.Pregunta) {
    pregunta.retirada = true;
  }

  volverAPreguntar(pregunta: ModelsEncuestas.Pregunta) {
    delete pregunta.retirada;
  }

  /** Las que se van a preguntar de verdad. */
  vigentes(modulo: ModelsEncuestas.Modulo): ModelsEncuestas.Pregunta[] {
    return modulo.preguntas.filter(p => !p.retirada);
  }

  retiradas(modulo: ModelsEncuestas.Modulo): ModelsEncuestas.Pregunta[] {
    return modulo.preguntas.filter(p => p.retirada);
  }

  /**
   * Sube o baja una pregunta una posición de las que se ven.
   *
   * Trabaja sobre la pregunta y no sobre su índice en pantalla: las retiradas
   * siguen dentro del módulo pero no se muestran, así que la posición tercera
   * de la lista visible puede ser la quinta del array. Y al buscar destino se
   * salta lo retirado, porque moverse "una posición" tiene que significar una
   * de las que el administrador está viendo.
   */
  moverPregunta(
    modulo: ModelsEncuestas.Modulo,
    pregunta: ModelsEncuestas.Pregunta,
    salto: number,
  ) {
    const preguntas = modulo.preguntas;
    const desde = preguntas.indexOf(pregunta);
    if (desde < 0) return;

    let hasta = desde + salto;
    while (hasta >= 0 && hasta < preguntas.length && preguntas[hasta].retirada) {
      hasta += salto;
    }
    if (hasta < 0 || hasta >= preguntas.length) return;

    const copia = [...preguntas];
    [copia[desde], copia[hasta]] = [copia[hasta], copia[desde]];
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

  // ── Vista previa ──────────────────────────────────────────────────────

  /**
   * Enseña el cuestionario como lo verá quien lo responda.
   *
   * El editor se lee por campos: un enunciado aquí, un tipo allá, las opciones
   * plegadas en otra fila. Eso está bien para construir, pero no deja ver lo
   * único que importa de verdad —si la encuesta se entiende seguida, si una
   * pregunta se pisa con la anterior, si el módulo es más largo de lo que nadie
   * va a aguantar—. Para eso hace falta verla como la ve quien contesta.
   *
   * Sale de lo que hay en el editor, sin guardar: sirve para revisar antes de
   * publicar, que es justo cuando todavía se puede cambiar.
   */
  vistaPrevia = signal(false);

  /** Con qué control se pinta cada pregunta en la vista previa. */
  esDeOpciones(pregunta: ModelsEncuestas.Pregunta): boolean {
    return this.llevaOpciones(pregunta);
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
   * En la vista previa salen todas seguidas, y sin la aclaración parece que se
   * le van a preguntar cosas a quien nunca las verá: a alguien que acaba de
   * decir que no conduce no se le pide la licencia.
   */
  condicionDe(pregunta: ModelsEncuestas.Pregunta): string {
    const condicion = pregunta.condicion;
    if (!condicion) return '';

    const dueña = (this.edicion()?.modulos ?? [])
      .flatMap(m => m.preguntas)
      .find(p => p.id === condicion.pregunta);

    const enunciado = dueña?.etiqueta || condicion.pregunta;
    return `Solo si en "${enunciado}" responde: ${condicion.valores.join(' o ')}`;
  }

  /** Cuántas preguntas tiene una encuesta, sumando sus módulos. */
  totalPreguntas(encuesta: ModelsEncuestas.Encuesta): number {
    // Lo retirado no se pregunta, así que no cuenta: el número tiene que
    // decir lo que va a tardar en responderse la encuesta.
    return encuesta.modulos.reduce((n, m) => n + this.vigentes(m).length, 0);
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
        // El identificador se comprueba también en las retiradas: es lo que
        // impide que una pregunta nueva se quede con el nombre de una vieja.
        if (vistos.has(pregunta.id)) {
          fallos.push(`El identificador "${pregunta.id}" está repetido.`);
        }
        vistos.add(pregunta.id);

        // Lo demás solo se le exige a lo que se va a preguntar.
        if (pregunta.retirada) continue;

        if (!pregunta.etiqueta.trim()) {
          fallos.push(`"${modulo.titulo}": hay una pregunta sin enunciado.`);
        }
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
        publicar ? { ...datos, estado: 'publicada' as const } : datos
      );
      this.aviso.set(publicar ? 'Encuesta publicada.' : 'Cambios guardados.');
      await this.cargar();
      const refrescada = this.lista().find(e => e.id === id);
      if (refrescada) this.edicion.set(structuredClone(refrescada));
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
