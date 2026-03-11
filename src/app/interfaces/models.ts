import { ModelEmpresa } from './empresas.interface';
import { ModelUsers } from './users.interface';
import { ModelsFirebase } from './firebase.interface';
import { ModelDiagnosticos } from './diagnosticos.interface';
import { ModelProcesos } from './procesosCarga.interface';
import { ModelDocumentos } from './documentos.interface';
import { ModelProgramas } from './programas.interface';
import { ModelPlanTrabajo } from './planTrabajo';
export namespace Models{

    export import Empresa = ModelEmpresa
    export import Users = ModelUsers
    export import Firebases = ModelsFirebase
    export import Diagnostico = ModelDiagnosticos
    export import Procesos = ModelProcesos
    export import Documentos = ModelDocumentos
    export import Programas = ModelProgramas
    export import PlanTrabajo = ModelPlanTrabajo
}