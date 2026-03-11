export namespace ModelEmpresa {

    export interface NuevaEmpresa{
        id?: string;               // Opcional, porque normalmente lo genera Firebase
        nombre: string;
        nit: string;
        direccion: string;
        ciudad: string;
        departamento: string;
        telefono: string;
        email: string;
        representanteLegal: string;
        estado?: string;
        logoURL?: string;
        fechaCreacion?: Date;      // Opcional si se llena automáticamente
    }

    export interface ConsultarEmpresa{
        cargoEmpresa: string;
        colaboradores: string;
        docCreado: string;
        email: string;
        estado: string;
        id: string;
        nitEmpresa: string;
        nivelAcceso: string;
        nombreCompleto: string;
        nombreEmpresa: string;
        rol: string;
        telefono: string;
        uid: string;
    }
}