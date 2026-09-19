import { Injectable, inject, signal } from '@angular/core';
import { QueryDocumentSnapshot } from '@angular/fire/firestore';
import { FirestoreService } from './firestore.service';
import { AuthenticacionService } from './authenticacion.service';
import { EmpresaService } from './empresa.service';
import { Models } from '../../interfaces/models';

/**
 * Cada bloque de datos que recoge el diagnóstico. El valor es el sufijo de la
 * subcolección bajo `Empresas/{nit}/periodos/{periodo}/`.
 *
 * Los colaboradores no están: dejaron de ser un registro propio y son las
 * respuestas a la encuesta, que viven en `Encuestas_publicas/{nit}/encuestas`.
 */
export type SeccionDiagnostico =
  | 'sedes'
  | 'servicios'
  | 'contratistas'
  | 'vehiculos'
  | 'rutas'
  | 'plan-emergencias';

/** Todas las secciones, para reconocerlas a partir de una ruta escrita. */
const SECCIONES: SeccionDiagnostico[] = [
  'sedes', 'servicios', 'contratistas',
  'vehiculos', 'rutas', 'plan-emergencias',
];

/** Prefijo común de las subcolecciones del diagnóstico. */
const PREFIJO = '006-diagnostico-';

/** Cuántos documentos se piden de golpe al desplegar una sección. */
const TAMANO_PAGINA = 100;

/** Solo interesan los registros vigentes; los borrados quedan marcados. */
const SOLO_ACTIVOS: Models.Firebases.whereQuery[] = [['estado', '==', 'Activo']];

/**
 * Una sección del diagnóstico cargada por tramos.
 *
 * Mantiene juntos el total real y lo que se ha traído hasta ahora, que no son
 * lo mismo: el total sale de una consulta de conteo y puede ser de miles,
 * mientras que `datos` crece de cien en cien conforme se pide más. Antes los
 * dos números eran el mismo `res.length` de una consulta recortada, y por eso
 * una empresa con 300 colaboradores decía tener 20.
 */
export class ListaDiagnostico<T> {

  /** Lo descargado hasta ahora, en orden. */
  readonly datos = signal<T[]>([]);

  /** Cuántos hay en total, contados en el servidor. */
  readonly total = signal(0);

  /** Queda algo por descargar después de lo que ya se tiene. */
  readonly hayMas = signal(false);

  /** Hay una petición en curso; sirve para no lanzar dos a la vez. */
  readonly cargando = signal(false);

  /** La sección se pidió alguna vez, aunque viniera vacía. */
  readonly cargada = signal(false);

  private cursor: QueryDocumentSnapshot | null = null;

  constructor(
    private readonly firestore: FirestoreService,
    private readonly ruta: () => string,
    private readonly etiqueta: string
  ) {}

  /**
   * Trae el primer tramo y el total. No hace nada si ya está cargada, para que
   * volver a una pestaña ya vista no vuelva a pagar las lecturas.
   */
  async cargar(): Promise<void> {
    if (this.cargada() || this.cargando()) return;
    await this.recargar();
  }

  /**
   * Vuelve a leer la sección. Se usa tras crear, editar o borrar.
   *
   * Recupera tantos tramos como hubiera cargados, no solo el primero: si
   * alguien había pulsado "cargar más" tres veces, una edición no debe dejarle
   * la lista encogida a los primeros cien.
   */
  async recargar(): Promise<void> {
    if (this.cargando()) return;

    const tramos = Math.max(1, Math.ceil(this.datos().length / TAMANO_PAGINA));
    this.cargando.set(true);
    try {
      const path = this.ruta();

      // El conteo y el primer tramo son independientes: en paralelo tardan lo
      // que el más lento en vez de la suma de los dos.
      const [total, primera] = await Promise.all([
        this.firestore.contarDocumentos(path, SOLO_ACTIVOS),
        this.firestore.getPagina<T>(path, SOLO_ACTIVOS, this.opciones()),
      ]);

      let acumulado = primera.datos;
      let cursor = primera.cursor;
      let hayMas = primera.hayMas;

      for (let i = 1; i < tramos && hayMas && cursor; i++) {
        const siguiente = await this.firestore.getPagina<T>(
          path, SOLO_ACTIVOS, this.opciones(), cursor
        );
        acumulado = [...acumulado, ...siguiente.datos];
        cursor = siguiente.cursor;
        hayMas = siguiente.hayMas;
      }

      this.total.set(total);
      this.datos.set(acumulado);
      this.cursor = cursor;
      this.hayMas.set(hayMas);
      this.cargada.set(true);
    } catch (error: unknown) {
      console.error(`[Diagnostico] cargar ${this.etiqueta}:`, error);
      throw error;
    } finally {
      this.cargando.set(false);
    }
  }

  /** Añade el siguiente tramo a lo que ya se mostraba. */
  async cargarMas(): Promise<void> {
    if (this.cargando() || !this.hayMas() || !this.cursor) return;
    this.cargando.set(true);
    try {
      const pagina = await this.firestore.getPagina<T>(
        this.ruta(),
        SOLO_ACTIVOS,
        this.opciones(),
        this.cursor
      );

      this.datos.update((previos) => [...previos, ...pagina.datos]);
      this.cursor = pagina.cursor;
      this.hayMas.set(pagina.hayMas);
    } catch (error: unknown) {
      console.error(`[Diagnostico] cargarMas ${this.etiqueta}:`, error);
      throw error;
    } finally {
      this.cargando.set(false);
    }
  }

  /**
   * Solo el total, sin traer documentos. Es lo que necesita el tablero para
   * pintar las tarjetas de resumen: una lectura por sección en vez de cien.
   */
  async contar(): Promise<void> {
    try {
      this.total.set(await this.firestore.contarDocumentos(this.ruta(), SOLO_ACTIVOS));
    } catch (error: unknown) {
      console.error(`[Diagnostico] contar ${this.etiqueta}:`, error);
    }
  }

  /**
   * Orden y tamaño de tramo. Va aparte porque lo comparten las tres consultas
   * y tienen que coincidir: el cursor de paginación solo es válido si la
   * ordenación es la misma.
   */
  private opciones(): Models.Firebases.extrasQuery {
    return { orderParam: 'docCreado', directionSort: 'desc', limit: TAMANO_PAGINA };
  }

  /** Olvida lo descargado, por ejemplo al cambiar de periodo. */
  reiniciar(): void {
    this.datos.set([]);
    this.total.set(0);
    this.hayMas.set(false);
    this.cargada.set(false);
    this.cursor = null;
  }
}

/**
 * Cifras del tablero. Todas salen de consultas de agregación, así que el
 * tablero entero cuesta una lectura por cifra en vez de descargar las siete
 * subcolecciones.
 */
export interface ResumenDiagnostico {
  sedes: number;
  servicios: number;
  colaboradores: number;
  contratistas: number;
  vehiculos: number;
  rutas: number;
  planEmergencias: number;
  /** Conductores declarados por los contratistas, sumados en el servidor. */
  conductores: number;
  masculino: number;
  femenino: number;
}

/**
 * Punto único desde el que el diagnóstico habla con Firestore.
 *
 * Reúne las rutas de las siete subcolecciones, que antes estaban repetidas
 * literal en cada componente, y decide cómo se leen: el total por consulta de
 * conteo y el listado por tramos, nunca la colección entera.
 */
@Injectable({ providedIn: 'root' })
export class DiagnosticoDatosService {

  private _firestore = inject(FirestoreService);
  private _auth = inject(AuthenticacionService);
  private _empresa = inject(EmpresaService);

  /** Subcolección donde vive el documento base del diagnóstico. */
  rutaBase(): string {
    return `${this.rutaPeriodo()}/006-diagnostico`;
  }

  /** Subcolección de una sección concreta. */
  ruta(seccion: SeccionDiagnostico): string {
    return `${this.rutaPeriodo()}/006-diagnostico-${seccion}`;
  }

  /**
   * Crea la lista paginada de una sección. El componente la guarda y la usa
   * como estado; la ruta se resuelve en cada petición para que un cambio de
   * periodo no deje la lista apuntando al año anterior.
   */
  lista<T>(seccion: SeccionDiagnostico): ListaDiagnostico<T> {
    return new ListaDiagnostico<T>(
      this._firestore,
      () => this.ruta(seccion),
      seccion
    );
  }

  /**
   * Toda la sección, para las pantallas de análisis.
   *
   * Las gráficas agrupan por campos de texto libre (área, escolaridad, tipo de
   * contrato) y cruzan unos con otros. Firestore no sabe agrupar, y las
   * categorías no se conocen de antemano, así que no hay forma de contarlas en
   * el servidor: hay que traer los registros y agrupar aquí.
   *
   * Se trae entero a propósito, sin tope. Recortarlo daría gráficas que
   * parecen correctas y no lo son, que es justo el fallo que tenían las
   * pestañas. Si alguna empresa llega a tantos registros que la pantalla se
   * arrastre, la salida es precalcular el resumen al escribir, no recortar.
   */
  async todos<T>(seccion: SeccionDiagnostico): Promise<T[]> {
    const path = this.ruta(seccion);
    const acumulado: T[] = [];
    let cursor: QueryDocumentSnapshot | null = null;

    for (;;) {
      const pagina: Models.Firebases.Pagina<T> = await this._firestore.getPagina<T>(
        path,
        SOLO_ACTIVOS,
        { orderParam: 'docCreado', directionSort: 'desc', limit: 500 },
        cursor
      );
      acumulado.push(...pagina.datos);
      if (!pagina.hayMas || !pagina.cursor) return acumulado;
      cursor = pagina.cursor;
    }
  }

  /** El diagnóstico vigente del periodo, o `null` si aún no se ha creado. */
  async diagnosticoBase(): Promise<Models.Diagnostico.DiagnosticoBase | null> {
    const snap = await this._firestore.getDocumentsQuery<Models.Diagnostico.DiagnosticoBase>(
      this.rutaBase(),
      SOLO_ACTIVOS,
      { limit: 1, orderParam: 'docCreado', directionSort: 'desc' }
    );
    return snap.docs.length ? snap.docs[0].data() : null;
  }

  /**
   * Las cifras del tablero, todas a la vez.
   *
   * Sustituye a las siete suscripciones en tiempo real que descargaban las
   * colecciones enteras para acabar mostrando solo un número de cada una.
   *
   * Cada cifra se resuelve por separado: si una falla — por ejemplo porque le
   * falta su índice en Firestore — las demás se siguen mostrando. Con un
   * `Promise.all` el primer fallo dejaba el tablero entero en blanco.
   */
  async resumen(): Promise<ResumenDiagnostico> {
    // `extra` son condiciones sueltas en tripletas (campo, operador, valor)
    // que se suman con AND a la de estado activo.
    const contar = (seccion: SeccionDiagnostico, extra: any[] = []) =>
      this._firestore.contarDocumentos(this.ruta(seccion), [[...SOLO_ACTIVOS[0], ...extra]]);

    const [
      sedes, servicios, colaboradores, contratistas, vehiculos, rutas,
      planEmergencias, conductores, masculino, femenino,
    ] = await this.enParalelo([
      contar('sedes'),
      contar('servicios'),
      this.contarRespuestas(),
      contar('contratistas'),
      contar('vehiculos'),
      contar('rutas'),
      contar('plan-emergencias'),
      this._firestore.sumarCampo(this.ruta('contratistas'), 'conductores', SOLO_ACTIVOS),
      this.contarRespuestas(['genero', '==', 'Masculino']),
      this.contarRespuestas(['genero', '==', 'Femenino']),
    ]);

    return {
      sedes, servicios, colaboradores, contratistas, vehiculos, rutas,
      planEmergencias, conductores, masculino, femenino,
    };
  }

  /**
   * A qué sección del diagnóstico afecta una ruta que se acaba de escribir, o
   * `null` si no es cosa del diagnóstico.
   *
   * Compara el nombre completo de la subcolección, no un `includes`: de otro
   * modo una escritura en `006-diagnostico-colaboradores-importados` pasaría
   * por una de `006-diagnostico-colaboradores`.
   */
  /**
   * Lanza todas las consultas a la vez y devuelve un 0 por cada una que falle,
   * dejando el motivo en consola. Una cifra que no se puede calcular no debe
   * tumbar las nueve restantes.
   */
  private async enParalelo(consultas: Promise<number>[]): Promise<number[]> {
    const resultados = await Promise.allSettled(consultas);
    return resultados.map((r) => {
      if (r.status === 'fulfilled') return r.value;
      console.error('[Diagnostico] resumen, una cifra no se pudo calcular:', r.reason);
      return 0;
    });
  }

  seccionDeRuta(path: string): SeccionDiagnostico | null {
    const partes = path.split('/');
    // Empresas / {nit} / periodos / {periodo} / {subcoleccion} / [{id}]
    if (partes.length < 5 || partes[0] !== 'Empresas' || partes[2] !== 'periodos') return null;

    const coleccion = partes[4];
    if (!coleccion.startsWith(PREFIJO)) return null;

    const sufijo = coleccion.slice(PREFIJO.length) as SeccionDiagnostico;
    return SECCIONES.includes(sufijo) ? sufijo : null;
  }

  /**
   * Cuenta colaboradores, que son las respuestas a la encuesta del periodo.
   *
   * Ya no hay un registro de colaboradores que teclear aparte: para una
   * empresa de miles de empleados consolidarlo a mano es inviable, y el
   * diagnostico se hace por muestreo. Quien responde la encuesta es un
   * colaborador de la lista.
   */
  private contarRespuestas(extra: any[] = []): Promise<number> {
    const nit = this._empresa.nit();
    if (!nit) return Promise.resolve(0);

    return this._firestore.contarDocumentos(
      `Encuestas_publicas/${nit}/encuestas`,
      [['periodo', '==', this._auth.periodo(), ...extra]]
    );
  }

  private rutaPeriodo(): string {
    const nit = this._empresa.nit();
    if (!nit) throw new Error('No hay empresa en sesión');
    return `Empresas/${nit}/periodos/${this._auth.periodo()}`;
  }
}
