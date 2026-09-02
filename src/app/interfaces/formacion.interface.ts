export namespace ModelFormacion {

    /**
     * Fila de la matriz de competencias: qué debe saber o poder hacer un cargo
     * en materia de seguridad vial, y cómo se verifica.
     */
    export interface Competencia {
        id?: string;
        cargo: string;
        competencia: string;
        nivelRequerido: string;      // Básico | Intermedio | Avanzado
        formaVerificacion: string;   // certificado, licencia, evaluación práctica...
        obligatoria: boolean;
        docCreado?: Date;
        estado?: string;             // Activo | NoActivo
    }

    export interface ConsultarCompetencia extends Competencia {
        id: string;
        estado: string;
    }

    export type EstadoCapacitacion = 'Programada' | 'Realizada' | 'Cancelada';

    /** Capacitación del plan anual de formación. */
    export interface Capacitacion {
        id?: string;
        nombre: string;
        objetivo: string;
        cargosDirigidos: string[];
        modalidad: string;                    // Presencial | Virtual | Mixta
        intensidadHoras: number | null;
        responsable: string;                  // quién la dicta
        fechaProgramada: string;              // 'YYYY-MM-DD'
        fechaEjecucion: string | null;
        estadoCapacitacion: EstadoCapacitacion;
        asistentes: string[];                 // nombres de colaboradores, opcional
        docCreado?: Date;
        estado?: string;
    }

    export interface ConsultarCapacitacion extends Capacitacion {
        id: string;
        estado: string;
    }
}
