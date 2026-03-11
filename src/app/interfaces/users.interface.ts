export namespace ModelUsers {

    export interface RegistrarUsuario{
    
        nombreCompleto: string;
        email: string;
        password: string;
        nitEmpresa: string;
        nombreEmpresa: string;
        cargoEmpresa: string;
        telefono: string;
        rol: string;
        colaboradores?: [string];
        nivelAcceso: string;
    }

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
    
    export interface EncuestaInicial{
        
        nivelAcceso: string;
        encuestas?: {   
            actividad: string;
            numVehiculos?: string;
            contrataConductores: string;
            numConductores?: string;
            vehiculosTerceros: string;

          }[];
        
    }
}