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
     * cosas, para cuando además interesa el peso de cada una.
     */
    grafica?: 'columnas' | 'barras' | 'tabla' | 'tablaPastel';
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
    filas: string[][];
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
    cifras: Cifra[];
    repartos: Reparto[];
    /** Vacía cuando la sección no tiene datos que mostrar. */
    sinDatos?: boolean;
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
    /** Solo uno está vigente; los demás quedan consultables. */
    estado: 'vigente' | 'historico' | string;
    fechaEmision: string;
    /** Quién lo emitió, para que el documento tenga responsable. */
    emitidoPor: string;
    docCreado?: unknown;
  }
}
