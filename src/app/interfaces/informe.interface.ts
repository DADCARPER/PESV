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
