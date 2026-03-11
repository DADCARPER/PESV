export namespace ModelPlanTrabajo {

    export interface NuevoPlanTrabajo{
        id?: string;               // Opcional, porque normalmente lo genera Firebase
        anoActual: number;
        metaGestion: number;
        objetivoGestion: string;
        estado: string;
        docCreado?: Date;
    }

    export interface ConsultarPlanTrabajo{
        id: string;
        anoActual: number;
        metaGestion: number;
        objetivoGestion: string;
        estado: string;
        docCreado?: Date;
        totalActividades?: number;
        totalActividadesCompletadas?: number;
        totalActividadesPendientes?: number;
        totalActividadesVencidas?: number;
    }

    export interface ConsultarPlanTrabajoActividades{
        id: string;
        nameActividad: string;
        tipoactividad: string;
        startDate: string;
        endDate: string;
        descripcionActividad: string;
        responsable: string;
        ubicacion: string;
        pesoActividad: number;
        participantes: number;
        estado: string;
        status: string;
        docCreado?: Date;
        totalactividades?: number;
        totalactividadescompletadas?: number;
        totalactividadespendientes?: number;
        totalactividadesvencidas?: number;
    }

    
}