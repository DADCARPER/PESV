export namespace ModelEmpresa {

    /**
     * Datos de la organizacion, compartidos por todos sus usuarios.
     *
     * Viven en Empresas/{nit} y no en users/{uid}: con varios usuarios por
     * empresa, tenerlos en cada perfil significaba una copia por persona, y
     * dos copias divergentes hacen que las actas digan cosas distintas segun
     * quien las genere.
     */
    export interface DatosEmpresa {
        /** Identifica a la empresa en todo el sistema. No se edita. */
        nitEmpresa: string;
        /** Razon social: encabeza los documentos del PESV. */
        nombreEmpresa: string;
        emailEmpresa?: string;
        telefonoEmpresa?: string;
        departamento?: string;
        /** Ciudad; en base se guarda como municipio. */
        municipio?: string;
        direccion?: string;
        actividadEmpresa?: string;
        /** Firma las actas: las plantillas lo piden. */
        representanteLegal?: string;
        actualizadoEn?: string;
    }

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