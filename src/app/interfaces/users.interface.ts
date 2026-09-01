export namespace ModelUsers {

    export interface Usuario{

        id:string;
        nitEmpresa: string;
        nombreCompleto: string;
        nombreEmpresa: string;
        email: string;
        cargoEmpresa: string;
        telefono: string;
        rol: string;
        colaboradores?: [string];
        docActualizado: Date;
        docCreado: Date;
        nivelAcceso: string;
        estado: string;
        encuestas?: {   
            actividad: string;
            numVehiculos?: string;
            contrataConductores: string;
            numConductores?: string;
            vehiculosTerceros: string;

        }[];
    }
    
}