export namespace ModelObjetivosMetas {

    /** Meta medible asociada a un objetivo. Un objetivo tiene N metas. */
    export interface Meta {
        descripcion: string;
        indicador: string;
        unidad: string;              // %, siniestros, días, capacitaciones...
        lineaBase: number | null;    // valor de partida
        valorMeta: number | null;    // valor a alcanzar
        frecuencia: string;          // Mensual | Trimestral | Semestral | Anual
    }

    export interface NuevoObjetivo {
        id?: string;                 // lo genera Firestore
        codigo: string;              // OBJ-01, OBJ-02...
        descripcion: string;
        responsable: string;
        cargoResponsable: string;
        fechaInicio: string;
        fechaFin: string;
        metas: Meta[];
        docCreado?: Date;
        estado?: string;             // Activo | NoActivo
    }

    export interface ConsultarObjetivo extends NuevoObjetivo {
        id: string;
        estado: string;
    }
}
