export namespace ModelIndicadores {

    /** Constante oficial de la metodología: 1'000.000 de kilómetros. */
    export const K_TSV = 1_000_000;

    /** Niveles de pérdida con que se clasifica un siniestro vial. */
    export type NivelPerdida = 'fatales' | 'heridosGraves' | 'heridosLeves' | 'choquesSimples';

    export const NIVELES_PERDIDA: { clave: NivelPerdida; nombre: string; criterio: string }[] = [
        { clave: 'fatales',        nombre: 'Fatalidades',    criterio: 'Siniestros con víctimas mortales' },
        { clave: 'heridosGraves',  nombre: 'Heridos graves', criterio: 'Más de 30 días de incapacidad' },
        { clave: 'heridosLeves',   nombre: 'Heridos leves',  criterio: 'Hasta 30 días de incapacidad' },
        { clave: 'choquesSimples', nombre: 'Choques simples', criterio: 'Sin personas lesionadas' },
    ];

    export const MESES = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
    ];

    /** Los cuatro trimestres, cada uno con los índices de sus meses (0-11). */
    export const TRIMESTRES = [
        { nombre: 'T1', meses: [0, 1, 2] },
        { nombre: 'T2', meses: [3, 4, 5] },
        { nombre: 'T3', meses: [6, 7, 8] },
        { nombre: 'T4', meses: [9, 10, 11] },
    ];

    /** Siniestros de un mes, desglosados por nivel de pérdida. */
    export type SiniestrosMes = Record<NivelPerdida, number>;

    /**
     * Indicador 1 — Tasa de siniestros viales por nivel de pérdida.
     *
     *   TSV(n) = ( SV(tn) × K ) / km(t)
     *
     * La captura es mensual porque así reportan las planillas de viaje y el GPS;
     * el cálculo es trimestral porque así lo define la metodología.
     *
     * Se guarda como un único documento por periodo: son 12 kilometrajes,
     * 12 × 4 siniestros y 4 metas, siempre editados en bloque.
     */
    export interface IndicadorTSV {
        /** Kilómetros recorridos por toda la flota. Índice 0 = enero. */
        kilometraje: number[];
        /** Siniestros por mes y nivel de pérdida. Índice 0 = enero. */
        siniestros: SiniestrosMes[];
        /** Meta de TSV para cada nivel de pérdida. */
        metas: Record<NivelPerdida, number>;
    }

    /** Resultado calculado de un trimestre. */
    export interface ResultadoTrimestre {
        nombre: string;
        kilometros: number;
        siniestros: Record<NivelPerdida, number>;
        /** TSV de cada nivel; null cuando no hay kilómetros registrados. */
        tsv: Record<NivelPerdida, number | null>;
    }

    export function siniestrosVacios(): SiniestrosMes {
        return { fatales: 0, heridosGraves: 0, heridosLeves: 0, choquesSimples: 0 };
    }

    export function indicadorTSVVacio(): IndicadorTSV {
        return {
            kilometraje: Array(12).fill(0),
            siniestros: Array.from({ length: 12 }, () => siniestrosVacios()),
            metas: { fatales: 0, heridosGraves: 0, heridosLeves: 0, choquesSimples: 0 },
        };
    }
}
