export namespace ModelObjetivosMetas {

    /**
     * Jerarquía de la Resolución 40595 de 2022:
     *
     *   OBJETIVO GENERAL
     *     └── OBJETIVO ESPECÍFICO   meta %  ·  T1..T4 calculados  ·  ALCANZADO | NO ALCANZADO
     *           └── INDICADOR       meta    ·  T1..T4 capturados  ·  CUMPLE | NO CUMPLE
     *
     * Solo el indicador se captura. Todo lo demás se calcula hacia arriba.
     */

    export const TRIMESTRES = ['T1', 'T2', 'T3', 'T4'] as const;
    export type Trimestre = 0 | 1 | 2 | 3;

    /** Sentido en que un indicador se considera cumplido frente a su meta. */
    export type Direccion = 'mayorIgual' | 'menorIgual';

    export const DIRECCIONES: { clave: Direccion; simbolo: string; nombre: string; ayuda: string }[] = [
        { clave: 'mayorIgual', simbolo: '≥', nombre: 'Alcanzar o superar la meta',
          ayuda: 'Ej.: cobertura de formación, meta 90% — cumple con 90% o más' },
        { clave: 'menorIgual', simbolo: '≤', nombre: 'No superar la meta',
          ayuda: 'Ej.: tasa de siniestralidad, meta 5 — cumple con 5 o menos' },
    ];

    export type EstadoIndicador = 'CUMPLE' | 'NO CUMPLE' | 'SIN MEDIR';
    export type EstadoEspecifico = 'ALCANZADO' | 'NO ALCANZADO' | 'SIN MEDIR';

    /**
     * El objetivo general admite un grado intermedio, a diferencia del específico.
     * Umbrales sobre su cumplimiento (0 a 1):
     *   < 0,6            NO ALCANZADO
     *   >= 0,6 y < 1     ALCANZADO PARCIALMENTE
     *   = 1              ALCANZADO
     */
    export type EstadoGeneral = 'ALCANZADO' | 'ALCANZADO PARCIALMENTE' | 'NO ALCANZADO';

    export const UMBRAL_PARCIAL = 0.6;

    /** Máximo de caracteres de las descripciones de objetivos. */
    export const MAX_DESCRIPCION = 2000;

    // ── Documentos ────────────────────────────────────────────────────────────

    export interface ObjetivoGeneral {
        id?: string;
        codigo: string;          // OG-01
        descripcion: string;
        responsable: string;
        docCreado?: Date;
        estado?: string;         // Activo | NoActivo
    }

    export interface ObjetivoEspecifico {
        id?: string;
        objetivoGeneralId: string;
        codigo: string;          // OE-01
        descripcion: string;
        /** Porcentaje de indicadores que deben cumplir para darlo por alcanzado. */
        meta: number;
        docCreado?: Date;
        estado?: string;
    }

    export interface Indicador {
        id?: string;
        objetivoEspecificoId: string;
        codigo: string;          // IND-01
        nombre: string;
        unidad: string;          // %, siniestros, días...
        direccion: Direccion;
        meta: number;
        /** Valor medido en cada trimestre; null mientras no se ha medido. */
        trimestres: (number | null)[];
        docCreado?: Date;
        estado?: string;
    }

    export interface ConsultarObjetivoGeneral extends ObjetivoGeneral { id: string; estado: string; }
    export interface ConsultarObjetivoEspecifico extends ObjetivoEspecifico { id: string; estado: string; }
    export interface ConsultarIndicador extends Indicador { id: string; estado: string; }

    // ── Resultados calculados ─────────────────────────────────────────────────

    /** Un objetivo específico con su avance por trimestre ya resuelto. */
    export interface AvanceEspecifico {
        especifico: ConsultarObjetivoEspecifico;
        indicadores: ConsultarIndicador[];
        /** Porcentaje de indicadores que cumplen en cada trimestre; null si ninguno se midió. */
        porTrimestre: (number | null)[];
        estados: EstadoEspecifico[];
        /** Promedio de los trimestres medidos. */
        avanceAnual: number | null;
    }

    export interface AvanceGeneral {
        general: ConsultarObjetivoGeneral;
        especificos: AvanceEspecifico[];
        /**
         * Objetivos específicos alcanzados sobre el total, de 0 a 1.
         * Los que aún no se han medido cuentan en el denominador: un objetivo
         * sin medir no está alcanzado.
         */
        cumplimiento: number | null;
        estado: EstadoGeneral | 'SIN MEDIR';
    }

    export function trimestresVacios(): (number | null)[] {
        return [null, null, null, null];
    }
}
