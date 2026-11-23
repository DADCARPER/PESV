/**
 * El informe de diagnóstico, como datos.
 *
 * Un informe emitido guarda **una copia de sus cifras**, no una referencia a
 * las colecciones. El PDF se vuelve a generar a partir de ella cuando haga
 * falta, así que el documento no cambia aunque el diagnóstico siga creciendo:
 * es lo que permite reproducir dentro de un año lo que se presentó hoy.
 *
 * Solo cubre el paso 5. Los módulos de liderazgo, comité y políticas tienen
 * sus propios documentos.
 */
export namespace ModelsInforme {

  /** Un número del informe, con su etiqueta ya redactada. */
  export interface Cifra {
    etiqueta: string;
    valor: string | number;
    /** Merece atención: un SOAT vencido, un escenario sin cubrir. */
    alerta?: boolean;
    /** Aclaración corta bajo la cifra. */
    nota?: string;
  }

  /** Cómo se reparten las respuestas de una pregunta, listo para graficar. */
  export interface Reparto {
    /** De qué pregunta sale, cuando viene de la encuesta. */
    id?: string;
    titulo: string;
    filas: { etiqueta: string; total: number; porcentaje: number }[];
    /**
     * Texto propuesto para este reparto concreto, editable como el de la
     * sección. No todos lo llevan: solo los que merecen una lectura.
     */
    texto?: string;
    /**
     * Cómo se pinta. Por defecto, barras sencillas embebidas.
     *
     * `columnas` son barras verticales, para escalas que se leen en orden;
     * `barras` son horizontales, para categorías sueltas con nombres largos;
     * `tabla` es solo el listado, centrado, cuando el dato exacto basta y un
     * gráfico de tres categorías no añade nada; `tablaPastel` pone las dos
     * cosas, para cuando además interesa el peso de cada una; `dona` es un
     * anillo, para repartos de pocas categorías que se leen como partes de un
     * todo.
     */
    grafica?: 'columnas' | 'barras' | 'tabla' | 'tablaPastel' | 'dona';
    /**
     * Qué cuentan las filas, para la cabecera de la tabla.
     *
     * Por defecto son personas, que es de donde sale la mayor parte del
     * informe. Pero la flota cuenta vehículos, contratistas cuenta empresas y
     * rutas cuenta rutas: una columna titulada "Personas" sobre un recuento
     * de camiones dice algo que no es.
     */
    unidad?: string;
    /**
     * Otro reparto que se pinta a su lado, bajo un mismo texto.
     *
     * Para preguntas que son la misma familia y se leen juntas: el tipo de
     * contrato y la jornada hablan las dos de las condiciones de vinculación,
     * y separadas ocupan el doble de alto diciendo lo mismo.
     */
    emparejado?: Reparto;
  }

  /**
   * Una sede tal como sale en el informe.
   *
   * Va aparte de las cifras porque no es un numero: el informe necesita
   * nombrarlas, decir donde estan y, si la hay, ensenar su fotografia.
   */
  export interface FichaSede {
    nombre: string;
    tipo: string;
    direccion: string;
    ciudad: string;
    departamento: string;
    responsable: string;
    telefono: string;
    empleados: number;
    fotoUrl?: string;
    /** La miniatura embebida, que es la que se imprime. */
    fotoMiniatura?: string;
  }

  /**
   * Un listado del informe.
   *
   * Con pocos registros una tabla dice mas que un grafico: se lee cada fila
   * entera en vez de un reparto que reparte casi nada.
   */
  export interface Tabla {
    titulo: string;
    columnas: string[];
    /**
     * Cada fila envuelta en un objeto, y no como `string[][]`.
     *
     * Firestore no admite un array cuyos elementos sean arrays, y el informe
     * emitido guarda sus tablas tal cual. Un nivel de objeto por medio es lo
     * único que hace falta para que la escritura pase.
     */
    filas: { celdas: string[] }[];
  }

  /**
   * Una cifra que va suelta y grande, con su icono.
   *
   * Para lo que se mira de un vistazo y no admite comparacion en barras: el
   * reparto por genero de la poblacion encuestada, por ejemplo.
   */
  export interface Destacado {
    etiqueta: string;
    valor: number;
    porcentaje: number;
    icono: string;
  }

  export interface Seccion {
    id: string;
    titulo: string;
    /** Lo que el sistema propone decir. El líder lo edita antes de emitir. */
    texto: string;
    /**
     * Qué hacer con lo que la sección encontró, una acción por línea.
     *
     * Sale de los hallazgos y no de una plantilla: una recomendación que
     * aparece cuando no hay nada que recomendar es ruido, y el lector aprende
     * a saltársela. Cuando la sección está en regla, va vacía.
     *
     * El sistema propone; quien emite decide. Es el campo que más se va a
     * editar del informe, porque una acción depende del presupuesto y del
     * calendario de la empresa, y eso el diagnóstico no lo sabe.
     */
    recomendaciones?: string;
    cifras: Cifra[];
    repartos: Reparto[];
    /** Vacía cuando la sección no tiene datos que mostrar. */
    sinDatos?: boolean;
    /**
     * Si la sección va en el informe. Lo decide quien emite.
     *
     * No todas las empresas tienen flota, contratistas o rutas, y una sección
     * que existe solo para decir "no hay datos" estorba más que informa.
     * Ausente cuenta como incluida: los informes emitidos antes de que
     * existiera este campo salen como salían.
     */
    incluir?: boolean;
    /**
     * Datos de identificación, cuando la sección los lleva.
     *
     * `largo` marca los que traen texto de varias líneas: van a ancho completo
     * y como párrafo, porque metidos en una rejilla de tarjetas estiran la
     * fila y descuadran el resto.
     */
    identificacion?: {
      etiqueta: string;
      valor: string;
      largo?: boolean;
      /**
       * El sistema propone un valor pero quien emite puede cambiarlo.
       *
       * Es el caso del responsable del informe: la empresa puede tener varios
       * operativos y el que abre la pantalla no tiene por que ser quien firma.
       */
      editable?: boolean;
      /**
       * Para encontrar el dato sin depender de su posición ni de su etiqueta.
       *
       * Hay más de un editable: buscar "el primero" confundía el NIT con el
       * responsable que firma.
       */
      clave?: 'razonSocial' | 'nit' | 'responsable';
    }[];
    /** Solo la sección de organización: una ficha por sede. */
    sedes?: FichaSede[];
    /** Listados que acompañan a las cifras. */
    tablas?: Tabla[];
    /** Cifras sueltas y grandes, centradas, con icono. */
    destacados?: Destacado[];
  }

  /**
   * Cómo se levantó la información.
   *
   * Va en el informe porque un diagnóstico por muestreo tiene que declarar su
   * muestra: "200 de 2.000 empleados" es defendible; "200 colaboradores" a
   * secas parece un censo mal hecho.
   */
  export interface Metodologia {
    /** Empleados que declara tener la empresa. */
    poblacion: number;
    /** Cuántos respondieron la encuesta. */
    muestra: number;
    /** Porcentaje de la población que respondió. */
    cobertura: number;
    /** Qué encuesta se usó y de qué versión. */
    encuesta: string;
  }

  /** Lo que se congela al emitir un informe. */
  export interface Datos {
    nitEmpresa: string;
    nombreEmpresa: string;
    periodo: number;
    metodologia: Metodologia;
    secciones: Seccion[];
  }

  /** Un informe emitido, tal como se guarda. */
  export interface Informe extends Datos {
    id: string;
    /** Sube con cada emisión del periodo. */
    version: number;
    /**
     * Solo uno está vigente; los demás quedan consultables.
     *
     * No se llama `estado` porque ese nombre ya está tomado: el CRUD del
     * proyecto lo usa para el borrado lógico y escribe "Activo" en cada
     * documento que crea. Dos significados en un mismo campo acaban siempre
     * con uno de los dos pisando al otro.
     */
    vigencia: 'vigente' | 'historico' | string;
    fechaEmision: string;
    /** Quién lo emitió, para que el documento tenga responsable. */
    emitidoPor: string;
    docCreado?: unknown;
  }
}
