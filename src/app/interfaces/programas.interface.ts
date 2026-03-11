export namespace ModelProgramas {

    export interface NuevoPrograma{
        id?: string;               // Opcional, porque normalmente lo genera Firebase
        nom_programa: string;
        objetivo: string;
        fechaCreacion?: Date;      // Opcional si se llena automáticamente
        estado?: string;
        estadoprograma?: string;
        bandera?: string;
        urlImagen?: string;
    }

    export interface ConsultarPrograma{
        nom_programa: string;
        objetivo: string;
        fechaCreacion?: Date;
        estado: string;
        id: string;
        uid: string;
        estadoprograma?: string;
        bandera?: string;
        urlImagen?: string;
    }
    export interface NuevoActividad{
        programId: string,
        name: string,
        objetivodescripcion: string,
        responsable: string,
        descripcionindicator: string,
        tipoIndicador: string,
        startDate: string,
        endDate: string,
        status: string,
        meta: string,
        mayorMenor?: string,
        valorReal: string,
        comportamiento?: string,
        ingreso?: string,
        fechaCreacion?: Date;
        estado?: string;
        estadoactividad?: string;
        avance?: string;
        valorInicial?: string;
        pesoActividad?: string;
    }
    export interface ConsultarActividad{
        programId: string,
        name: string,
        objetivodescripcion: string,
        responsable: string,
        descripcionindicator: string,
        tipoIndicador: string,
        startDate: Date,
        endDate: Date,
        status: string;
        meta: string;
        mayorMenor?: string;
        valorReal: string;
        comportamiento?: string;
        ingreso?: string;
        fechaCreacion?: Date;
        estado?: string;
        estadoactividad?: string;
        avance?: string;
        valorInicial?: string;
        pesoActividad?: string;
    }
}