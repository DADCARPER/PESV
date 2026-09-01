import { inject, Injectable } from '@angular/core';
import { FirestoreService } from './firestore.service';
import { Models } from '../../interfaces/models';

@Injectable({
  providedIn: 'root'
})
export class AaDatosDefaultService {

  private _firestore = inject(FirestoreService);

  constructor() { }

  async inicializarDatos008Programas(nitEmpresa: string, periodo: number) {
    const programasDefault: Models.Programas.NuevoPrograma[] = [
      {
        nom_programa: 'Gestión de la Velocidad Segura',
        objetivo: 'Establecer controles y procedimientos para garantizar que los conductores respeten los límites de velocidad y conduzcan de manera segura.',
        urlImagen: 'https://firebasestorage.googleapis.com/v0/b/pesv-1ca41.appspot.com/o/Empresas%2Fdefault%2F008-programas%2Fvelocidad.png?alt=media&token=44ba8acb-06be-4ebb-904f-9735d0830121',
        estadoprograma: 'Activo',
        bandera: 'NoActivo'
      },
      {
        nom_programa: 'Prevención de la Fatiga',
        objetivo: 'El programa de prevención de la fatiga pretende controlar las horas de conducción continuas y descanso de los colaboradores.',
        urlImagen: 'https://firebasestorage.googleapis.com/v0/b/pesv-1ca41.appspot.com/o/Empresas%2Fdefault%2F008-programas%2Ffatiga.png?alt=media&token=1b672e0b-8579-491b-84d1-9ae3ab616192',
        estadoprograma: 'Activo',
        bandera: 'NoActivo'
      },
      {
        nom_programa: 'Prevención de la Distracción',
        objetivo: 'Implementar medidas para evitar distracciones durante la conducción, incluyendo el uso de dispositivos móviles y otras actividades que comprometan la atención.',
        urlImagen: 'https://firebasestorage.googleapis.com/v0/b/pesv-1ca41.appspot.com/o/Empresas%2Fdefault%2F008-programas%2Fdistraccion.png?alt=media&token=22ec5414-eddd-48c3-a713-bbe13e6c93f8',
        estadoprograma: 'Activo',
        bandera: 'NoActivo'
      },
      {
        nom_programa: 'Cero tolerancia al Alcohol y SPA',
        objetivo: 'Establecer políticas de cero tolerancia al consumo de alcohol y sustancias psicoactivas para conductores y personal operativo.',
        urlImagen: 'https://firebasestorage.googleapis.com/v0/b/pesv-1ca41.appspot.com/o/Empresas%2Fdefault%2F008-programas%2Falcohol.png?alt=media&token=11de2c5d-93ce-445a-ab3d-923155fa4603',
        estadoprograma: 'Activo',
        bandera: 'NoActivo'
      },
      {
        nom_programa: 'Actores Viales Vulnerables',
        objetivo: 'Desarrollar estrategias para proteger a peatones, ciclistas, motociclistas y otros usuarios vulnerables de la vía.',
        urlImagen: 'https://firebasestorage.googleapis.com/v0/b/pesv-1ca41.appspot.com/o/Empresas%2Fdefault%2F008-programas%2Falcohol.png?alt=media&token=11de2c5d-93ce-445a-ab3d-923155fa4603',
        estadoprograma: 'Activo',
        bandera: 'NoActivo'
      }
    ];

    const programasCreados: string[] = [];

    try {
      for (const programa of programasDefault) {
        const idPrograma = await this._firestore.createDocumentDevolverId<Models.Programas.NuevoPrograma>(
          `Empresas/${nitEmpresa}/periodos/${periodo}/008-programas-gestion-riesgos`,
          programa
        );
        console.log(`Programa '${programa.nom_programa}' creado exitosamente.`, idPrograma.id);
        programasCreados.push(idPrograma.id);
        
        // Crear actividades para cada programa
        await this.inicializarDatos008Actividades(nitEmpresa, periodo, idPrograma.id, programa.nom_programa);
      }
      
      console.log('Todos los programas por defecto han sido creados exitosamente.');
      return programasCreados;
      
    } catch (error) {
      console.error('Error al crear programas por defecto:', error);
      throw error;
    }
  }
  
  async inicializarDatos008Actividades(nitEmpresa: string, periodo: number, idprograma: string, nombrePrograma: string) {
    const actividadesPorPrograma = this.obtenerActividadesPorPrograma(nombrePrograma, idprograma);
    
    try {
      for (const actividad of actividadesPorPrograma) {
        await this._firestore.createDocument<Models.Programas.NuevoActividad>(
          `Empresas/${nitEmpresa}/periodos/${periodo}/008-actividades-gestion-riesgos`,
          actividad
        );
        console.log(`Actividad '${actividad.name}' creada exitosamente para ${nombrePrograma}.`);
      }
    } catch (error) {
      console.error(`Error al crear actividades para ${nombrePrograma}:`, error);
      throw error;
    }
  }

  private obtenerActividadesPorPrograma(nombrePrograma: string, idprograma: string): Models.Programas.NuevoActividad[] {
    const fechaInicio = new Date();
    const fechaFin = new Date();
    fechaFin.setMonth(fechaFin.getMonth() + 6); // 6 meses después
    const fechaInicioStr = this.formatYYYYMMDD(fechaInicio);
    const fechaFinStr = this.formatYYYYMMDD(fechaFin);

    switch (nombrePrograma) {
      case 'Gestión de la Velocidad Segura':
        return [
          {
            programId: idprograma,
            name: "Capacitación en límites de velocidad",
            objetivodescripcion: "Entrenar a conductores sobre la importancia de respetar los límites de velocidad y técnicas de conducción segura.",
            responsable: "SST",
            descripcionindicator: "Reducir infracciones por exceso de velocidad en 20%",
            startDate: fechaInicioStr,
            endDate: fechaFinStr,
            status: "En ejecución",
            tipoIndicador: "porcentaje",
            meta: "20",
            valorReal: "0",
            comportamiento: "Ascendente",
            ingreso: "Acumulado",
            valorInicial: "0",
            avance: "0",
            pesoActividad: "30"
          },
          {
            programId: idprograma,
            name: "Instalación de sistemas de monitoreo de velocidad",
            objetivodescripcion: "Implementar tecnología para monitorear y controlar la velocidad de los vehículos en tiempo real.",
            responsable: "Mantenimiento",
            descripcionindicator: "100% de vehículos con sistema de monitoreo",
            startDate: fechaInicioStr,
            endDate: fechaFinStr,
            status: "En ejecución",
            tipoIndicador: "porcentaje",
            meta: "100",
            valorReal: "0",
            comportamiento: "Ascendente",
            ingreso: "Acumulado",
            valorInicial: "0",
            avance: "0",
            pesoActividad: "30"
          },
          {
            programId: idprograma,
            name: "Evaluación periódica de conductores",
            objetivodescripcion: "Realizar evaluaciones regulares del desempeño de conductores en cuanto al cumplimiento de velocidades seguras.",
            responsable: "SST",
            descripcionindicator: "95% de conductores aprobados en evaluación",
            startDate: fechaInicioStr,
            endDate: fechaFinStr,
            status: "En ejecución",
            tipoIndicador: "porcentaje",
            meta: "95",
            valorReal: "0",
            comportamiento: "Ascendente",
            ingreso: "Acumulado",
            valorInicial: "0",
            avance: "0",
            pesoActividad: "40"
          }
        ];

      case 'Prevención de la Fatiga':
        return [
          {
            programId: idprograma,
            name: "Capacitación en pausas activas",
            objetivodescripcion: "Entrenar al personal en técnicas de pausas activas y reconocimiento de signos de fatiga.",
            responsable: "SST",
            descripcionindicator: "Reducir incidentes por fatiga en 15%",
            startDate: fechaInicioStr,
            endDate: fechaFinStr,
            status: "En ejecución",
            tipoIndicador: "porcentaje",
            meta: "15",
            valorReal: "0",
            comportamiento: "Ascendente",
            ingreso: "Acumulado",
            valorInicial: "0",
            avance: "0",
            pesoActividad: "30"
          },
          {
            programId: idprograma,
            name: "Control de horas de conducción",
            objetivodescripcion: "Implementar sistema de control y registro de horas de conducción y descanso obligatorio.",
            responsable: "Operaciones",
            descripcionindicator: "100% cumplimiento de tiempos de descanso",
            startDate: fechaInicioStr,
            endDate: fechaFinStr,
            status: "En ejecución",
            tipoIndicador: "porcentaje",
            meta: "100",
            valorReal: "0",
            comportamiento: "Ascendente",
            ingreso: "Acumulado",
            valorInicial: "0",
            avance: "0",
            pesoActividad: "30"
          },
          {
            programId: idprograma,
            name: "Evaluación médica periódica",
            objetivodescripcion: "Realizar exámenes médicos regulares para detectar condiciones que puedan causar fatiga.",
            responsable: "Medicina Laboral",
            descripcionindicator: "100% de conductores evaluados anualmente",
            startDate: fechaInicioStr,
            endDate: fechaFinStr,
            status: "En ejecución",
            tipoIndicador: "porcentaje",
            meta: "100",
            valorReal: "0",
            comportamiento: "Ascendente",
            ingreso: "Acumulado",
            valorInicial: "0",
            avance: "0",
            pesoActividad: "30"
          }
        ];

      case 'Cero tolerancia al Alcohol y SPA':
        return [
          {
            programId: idprograma,
            name: "Pruebas de alcoholemia aleatorias",
            objetivodescripcion: "Realizar pruebas de alcoholemia y sustancias psicoactivas de forma aleatoria a conductores.",
            responsable: "SST",
            descripcionindicator: "100% de pruebas con resultado negativo",
            startDate: fechaInicioStr,
            endDate: fechaFinStr,
            status: "En ejecución",
            tipoIndicador: "porcentaje",
            meta: "100",
            valorReal: "0",
            comportamiento: "Ascendente",
            ingreso: "Acumulado",
            valorInicial: "0",
            avance: "0",
            pesoActividad: "30"
          },
          {
            programId: idprograma,
            name: "Capacitación en políticas de alcohol y SPA",
            objetivodescripcion: "Educar al personal sobre las políticas de la empresa y consecuencias del consumo de alcohol y SPA.",
            responsable: "Recursos Humanos",
            descripcionindicator: "100% del personal capacitado",
            startDate: fechaInicioStr,
            endDate: fechaFinStr,
            status: "En ejecución",
            tipoIndicador: "porcentaje",
            meta: "100",
            valorReal: "0",
            comportamiento: "Ascendente",
            ingreso: "Acumulado",
            valorInicial: "0",
            avance: "0",
            pesoActividad: "30"
          },
          {
            programId: idprograma,
            name: "Programa de apoyo y rehabilitación",
            objetivodescripcion: "Brindar apoyo y programas de rehabilitación para empleados con problemas de consumo.",
            responsable: "Bienestar Laboral",
            descripcionindicator: "80% de casos atendidos exitosamente",
            startDate: fechaInicioStr,
            endDate: fechaFinStr,
            status: "En ejecución",
            tipoIndicador: "porcentaje",
            meta: "80",
            valorReal: "0",
            comportamiento: "Ascendente",
            ingreso: "Acumulado",
            valorInicial: "0",
            avance: "0",
            pesoActividad: "40"
          }
        ];

      case 'Actores Viales Vulnerables':
        return [
          {
            programId: idprograma,
            name: "Capacitación en protección de peatones y ciclistas",
            objetivodescripcion: "Entrenar a conductores sobre cómo interactuar de manera segura con peatones, ciclistas y motociclistas.",
            responsable: "SST",
            descripcionindicator: "Reducir accidentes con actores vulnerables en 25%",
            startDate: fechaInicioStr,
            endDate: fechaFinStr,
            status: "En ejecución",
            tipoIndicador: "porcentaje",
            meta: "25",
            valorReal: "0",
            comportamiento: "Ascendente",
            ingreso: "Acumulado",
            valorInicial: "0",
            avance: "0",
            pesoActividad: "30"
          },
          {
            programId: idprograma,
            name: "Instalación de sistemas de detección",
            objetivodescripcion: "Implementar sistemas de detección de puntos ciegos y alertas para proteger actores vulnerables.",
            responsable: "Mantenimiento",
            descripcionindicator: "100% de vehículos con sistemas de detección",
            startDate: fechaInicioStr,
            endDate: fechaFinStr,
            status: "En ejecución",
            tipoIndicador: "porcentaje",
            meta: "100",
            valorReal: "0",
            comportamiento: "Ascendente",
            ingreso: "Acumulado",
            valorInicial: "0",
            avance: "0",
            pesoActividad: "30"
          },
          {
            programId: idprograma,
            name: "Campañas de sensibilización",
            objetivodescripcion: "Desarrollar campañas internas y externas para crear conciencia sobre la protección de actores viales vulnerables.",
            responsable: "Comunicaciones",
            descripcionindicator: "4 campañas realizadas por año",
            startDate: fechaInicioStr,
            endDate: fechaFinStr,
            status: "En ejecución",
            tipoIndicador: "Número",
            meta: "4",
            valorReal: "0",
            comportamiento: "Ascendente",
            ingreso: "Acumulado",
            valorInicial: "0",
            avance: "0",
            pesoActividad: "40"
          }
        ];

      case 'Prevención de la Distracción':
        return [
          {
            programId: idprograma,
            name: "Política de uso de dispositivos móviles",
            objetivodescripcion: "Establecer y hacer cumplir políticas sobre el uso de dispositivos móviles durante la conducción.",
            responsable: "SST",
            descripcionindicator: "Cero incidentes por distracción con dispositivos",
            startDate: fechaInicioStr,
            endDate: fechaFinStr,
            status: "En ejecución",
            tipoIndicador: "Número",
            meta: "0",
            valorReal: "0",
            comportamiento: "Ascendente",
            ingreso: "Acumulado",
            valorInicial: "0",
            avance: "0",
            pesoActividad: "30"
          },
          {
            programId: idprograma,
            name: "Capacitación en conducción defensiva",
            objetivodescripcion: "Entrenar a conductores en técnicas de conducción defensiva y manejo de distracciones.",
            responsable: "SST",
            descripcionindicator: "90% de conductores certificados",
            startDate: fechaInicioStr,
            endDate: fechaFinStr,
            status: "En ejecución",
            tipoIndicador: "porcentaje",
            meta: "90",
            valorReal: "0",
            comportamiento: "Ascendente",
            ingreso: "Acumulado",
            valorInicial: "0",
            avance: "0",
            pesoActividad: "30"
          },
          {
            programId: idprograma,
            name: "Inspección de cabinas de vehículos",
            objetivodescripcion: "Verificar que las cabinas estén libres de elementos que puedan causar distracción.",
            responsable: "Mantenimiento",
            descripcionindicator: "100% de vehículos inspeccionados mensualmente",
            startDate: fechaInicioStr,
            endDate: fechaFinStr,
            status: "En ejecución",
            tipoIndicador: "porcentaje",
            meta: "100",
            valorReal: "0",
            comportamiento: "Ascendente",
            ingreso: "Acumulado",
            valorInicial: "0",
            avance: "0",
            pesoActividad: "40"
          }
        ];

      default:
        return [];
    }
  }

  private formatYYYYMMDD(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
