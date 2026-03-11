import { inject, Injectable } from '@angular/core';
import { AuthenticacionService } from '../../../../services/shared/authenticacion.service';
import { FirestoreService } from '../../../../services/shared/firestore.service';
import { AlertaService } from '../../../../services/shared/alerta.service';

@Injectable({
  providedIn: 'root'
})
export class ActividadesDefaulService {

  private _authcations = inject(AuthenticacionService);
  private _firestore = inject(FirestoreService);
  public _alerta = inject(AlertaService);

  constructor() { }

  async crearActividadesDefaul(idPlanAnualTrabajo:string){
    const actividades = [
      {
        costos: "0",
        descripcionActividad: "Reunión periódica con el comité de seguridad vial para revisar avances y acuerdos.",
        endDate: "2025-09-05",
        estado: "Activo",
        modalidad: "Presencial",
        nameActividad: "Reunión Comité de seguridad vial",
        participantes: 10,
        responsable: "Comité de Seguridad Vial",
        startDate: "2025-09-01",
        status: "Programada",
        tipoactividad: "Seguimientos",
        tiempo: "2",
        planAnualtrabajoId: idPlanAnualTrabajo
      },
      {
        costos: "0",
        descripcionActividad: "Evaluación de resultados de gestión y definición de metas del periodo anterior.",
        endDate: "2025-09-12",
        estado: "Activo",
        modalidad: "Virtual",
        nameActividad: "Análisis de resultados de gestión y definición de metas del periodo anterior",
        participantes: 15,
        responsable: "Comité de Seguridad Vial",
        startDate: "2025-09-10",
        status: "Programada",
        tipoactividad: "Seguimientos",
        tiempo: "3",
        planAnualtrabajoId: idPlanAnualTrabajo
      },
      {
        costos: "0",
        descripcionActividad: "Revisión periódica de los factores de desempeño de los programas de gestión del riesgo.",
        endDate: "2025-09-20",
        estado: "Activo",
        modalidad: "Virtual",
        nameActividad: "Seguimiento factores de desempeño Programas de gestión del riesgo",
        participantes: 12,
        responsable: "Área HSEQ",
        startDate: "2025-09-18",
        status: "Programada",
        tipoactividad: "Seguimientos",
        tiempo: "2",
        planAnualtrabajoId: idPlanAnualTrabajo  
      },
      {
        costos: "0",
        descripcionActividad: "Revisión y actualización de la caracterización y control del riesgo vial.",
        endDate: "2025-09-28",
        estado: "Activo",
        modalidad: "Presencial",
        nameActividad: "Actualización caracterización y control del riesgo vial",
        participantes: 8,
        responsable: "HSEQ",
        startDate: "2025-09-25",
        status: "Programada",
        tipoactividad: "Seguimientos",
        tiempo: "2",
        planAnualtrabajoId: idPlanAnualTrabajo
      },
      {
        costos: "0",
        descripcionActividad: "Revisión y actualización del diagnóstico del PESV 2025.",
        endDate: "2025-09-30",
        estado: "Activo",
        modalidad: "Virtual",
        nameActividad: "Actualización Diagnostico PESV 2025",
        participantes: 20,
        responsable: "Coordinador PESV",
        startDate: "2025-09-29",
        status: "Programada",
        tipoactividad: "Seguimientos",
        tiempo: "3",
        planAnualtrabajoId: idPlanAnualTrabajo
      },
      {
        costos: "0",
        descripcionActividad: "Seguimiento a pruebas aleatorias de alcoholimetría para trabajadores.",
        endDate: "2025-10-05",
        estado: "Activo",
        modalidad: "Presencial",
        nameActividad: "Seguimiento de pruebas aleatorias de alcoholimetría",
        participantes: 25,
        responsable: "Área de SST",
        startDate: "2025-10-01",
        status: "Programada",
        tipoactividad: "Seguimientos",
        tiempo: "2",
        planAnualtrabajoId: idPlanAnualTrabajo
      },
      {
        costos: "0",
        descripcionActividad: "Campaña de divulgación de la Política SIG por correo, WhatsApp y carteleras.",
        endDate: "2025-10-10",
        estado: "Activo",
        modalidad: "Virtual",
        nameActividad: "Divulgación de Política SIG",
        participantes: 50,
        responsable: "Gestión de Comunicaciones",
        startDate: "2025-10-08",
        status: "Programada",
        tipoactividad: "Seguimientos",
        tiempo: "1",
        planAnualtrabajoId: idPlanAnualTrabajo
      },
      {
        costos: "0",
        descripcionActividad: "Auditorías del PESV a empresas contratistas.",
        endDate: "2025-10-15",
        estado: "Activo",
        modalidad: "Presencial",
        nameActividad: "Auditorias PESV empresas contratistas",
        participantes: 5,
        responsable: "Equipo Auditor",
        startDate: "2025-10-13",
        status: "Programada",
        tipoactividad: "Seguimientos",
        tiempo: "4",
        planAnualtrabajoId: idPlanAnualTrabajo
      },
      {
        costos: "0",
        descripcionActividad: "Planeación y ejecución de simulacro por siniestro vial en operación.",
        endDate: "2025-10-20",
        estado: "Activo",
        modalidad: "Presencial",
        nameActividad: "Planeación y ejecución de simulacro por siniestro vial durante la operación",
        participantes: 30,
        responsable: "Área Operaciones",
        startDate: "2025-10-18",
        status: "Programada",
        tipoactividad: "Seguimientos",
        tiempo: "3",
        planAnualtrabajoId: idPlanAnualTrabajo
      },
      {
        costos: "0",
        descripcionActividad: "Seguimiento al cronograma de mantenimiento de vehículos automotores y no automotores.",
        endDate: "2025-10-25",
        estado: "Activo",
        modalidad: "Virtual",
        nameActividad: "Seguimiento a cumplimiento de Cronograma de mantenimiento de vehículos",
        participantes: 12,
        responsable: "Área Mantenimiento",
        startDate: "2025-10-23",
        status: "Programada",
        tipoactividad: "Seguimientos",
        tiempo: "2",
        planAnualtrabajoId: idPlanAnualTrabajo
      },
      {
        costos: "0",
        descripcionActividad: "Verificación de inspecciones preoperacionales por contrato.",
        endDate: "2025-10-30",
        estado: "Activo",
        modalidad: "Presencial",
        nameActividad: "Seguimiento de Inspecciones Preoperacionales por contrato",
        participantes: 10,
        responsable: "Supervisores",
        startDate: "2025-10-28",
        status: "Programada",
        tipoactividad: "Seguimientos",
        tiempo: "2",
        planAnualtrabajoId: idPlanAnualTrabajo
      },
      {
        costos: "0",
        descripcionActividad: "Seguimiento y análisis de siniestros viales presentados.",
        endDate: "2025-11-05",
        estado: "Activo",
        modalidad: "Virtual",
        nameActividad: "Seguimiento y análisis de siniestros viales presentados",
        participantes: 15,
        responsable: "Área HSEQ",
        startDate: "2025-11-03",
        status: "Programada",
        tipoactividad: "Seguimientos",
        tiempo: "3",
        planAnualtrabajoId: idPlanAnualTrabajo
      },
      {
        costos: "0",
        descripcionActividad: "Revisión de infracciones de tránsito en RUNT y/o SIMIT.",
        endDate: "2025-11-10",
        estado: "Activo",
        modalidad: "Virtual",
        nameActividad: "Seguimiento infracciones de tránsito en plataformas RUNT/SIMIT",
        participantes: 8,
        responsable: "Área Jurídica",
        startDate: "2025-11-08",
        status: "Programada",
        tipoactividad: "Seguimientos",
        tiempo: "2",
        planAnualtrabajoId: idPlanAnualTrabajo
      },
      {
        costos: "0",
        descripcionActividad: "Seguimiento a excesos de jornadas laborales presentados.",
        endDate: "2025-11-15",
        estado: "Activo",
        modalidad: "Virtual",
        nameActividad: "Seguimiento a excesos de jornadas laborales presentados",
        participantes: 10,
        responsable: "Recursos Humanos",
        startDate: "2025-11-13",
        status: "Programada",
        tipoactividad: "Seguimientos",
        tiempo: "2",
        planAnualtrabajoId: idPlanAnualTrabajo
      },
      {
        costos: "0",
        descripcionActividad: "Verificación de resultados de medición de indicadores de gestión del PESV.",
        endDate: "2025-11-20",
        estado: "Activo",
        modalidad: "Virtual",
        nameActividad: "Verificación y análisis de resultados de medición de indicadores del PESV",
        participantes: 12,
        responsable: "Equipo de Indicadores",
        startDate: "2025-11-18",
        status: "Programada",
        tipoactividad: "Seguimientos",
        tiempo: "3",
        planAnualtrabajoId: idPlanAnualTrabajo
      },
      {
        costos: "0",
        descripcionActividad: "Auditoría anual interna SG-PESV conforme a resolución 40595 de 2022.",
        endDate: "2025-11-30",
        estado: "Activo",
        modalidad: "Presencial",
        nameActividad: "Desarrollo de Auditoria Anual Interna al SG - PESV",
        participantes: 6,
        responsable: "Equipo Auditor Interno",
        startDate: "2025-11-28",
        status: "Programada",
        tipoactividad: "Seguimientos",
        tiempo: "4",
        planAnualtrabajoId: idPlanAnualTrabajo
      }
    ];
    
    const nit = this._authcations.getCurrentUser().displayName;
    const path = `Empresas/${nit}/009-plan-anual-trabajo-actividades`;
    try {
      actividades.forEach(async (actividad) => {
        await this._firestore.createDocument(path, actividad);
      });
      this._alerta.showSuccess('Actividad creada exitosamente.');
    }catch (error) {
      this._alerta.showError('Tu Conexión Internet Falló');
    }
  }

}
