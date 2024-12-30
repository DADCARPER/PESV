import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { ComiteSeguridadVialService } from '../../../services/comite-seguridad-vial.service';

@Component({
  selector: 'app-pdf-comite-seguridad-vial',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pdf-comite-seguridad-vial.component.html',
  styleUrl: './pdf-comite-seguridad-vial.component.css'
})
export class PdfComiteSeguridadVialComponent implements OnInit {

  private  _comiteSeguridadVial = inject(ComiteSeguridadVialService);

  @Input() subirBlob: boolean = false;
  @Input() descargaOprevia: string = "vista"; //True es igual a vista previa false a descargar
  @Input() disenoboton: string = "diseno3"; // True diseño transparente
  @Input() disenoIcono: string = ""; // Diseño Icono
  @Input() nombreBoton: string = "Send";
  @Input() idFormulario: string = "0"; // Se requiere el idFomulario que es el nombre del documento 
  @Input() idusuario: string = "0"; // usuario logueado
  @Input() nombreEmpresa: string = ""; // usuario logueado

  data: any = {};
  datosEmpresa:any;
  clases: { [key: string]: string } = {
    diseno1: 'text-sky-500 bg-white border-sky-500 hover:bg-sky-500 hover:text-white border border-solid font-bold uppercase text-sm px-6 py-3 rounded-full outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150',
    diseno2: 'text-green-500 bg-white border-green-500 hover:bg-green-500 hover:text-white border border-solid font-bold uppercase text-sm px-6 py-3 rounded-full outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150',
    diseno3: 'text-red-500 bg-transparent border border-solid border-red-500 hover:bg-red-500 hover:text-white active:bg-red-600 font-bold uppercase text-xs px-4 py-2 rounded outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150',
    diseno4: 'text-amber-500 bg-transparent border border-solid border-amber-500 hover:bg-amber-500 hover:text-white active:bg-amber-600 font-bold uppercase text-xs px-4 py-2 rounded outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150',
    diseno5: 'text-teal-500 bg-transparent border border-solid border-teal-500 hover:bg-teal-500 hover:text-white active:bg-teal-600 font-bold uppercase text-xs px-4 py-2 rounded outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150',
    diseno6: 'text-sky-500 bg-transparent border border-solid border-sky-500 hover:bg-sky-500 hover:text-white active:bg-sky-600 font-bold uppercase text-xs px-4 py-2 rounded outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150'
  };

  ngOnInit(): void {
    // Asegúrate de que vfs esté asignado aquí
    pdfMake.vfs = pdfFonts.pdfMake;
    
  }

  async llamodatosFormulario(){
    if (this.idFormulario !== "0"){

   
        const dataCruda = await this._comiteSeguridadVial.getfomularioEdit(this.idFormulario);

          console.log("datacrudaaaaaaaaaaa",dataCruda);
        if (dataCruda['departamento'] != "") {// valido si un parametro obligatorio esta en el objeto. en caso de no estar es por que no existe el docuemnto
          
          this.data = dataCruda;
          //console.log( 'xsxsxsxs'+this.data);

          console.log('Datos cargados en el formulario:', this.data); //data['cargoLider']

        } else {
          console.error('No se encontraron datos para este formulario');
        }

  
      console.log('SI HAY FORMULARIO')
    }else{
      console.log('NO HAY FORMULARIO');
    }
  }

  async generatePdf(subirBlob:boolean): Promise<void> {

    

    await this.llamodatosFormulario();

    console.log("verver",this.data['integrantes']);

    const fechaArray = this.descomponerFecha(this.data['fechaDocumento']);

    // Generar las filas de la tabla
    let rows = [];
    for (let index = 0; index < this.data['integrantes'].length; index++) {
      const integrante = this.data['integrantes'][index];

      // Consola para ver el integrante actual
      //console.log(`Procesando integrante ${index + 1}:`, integrante);

      rows.push([
        { text: (index + 1).toString(), style: 'tableCell', alignment: 'center' }, // Número de fila
        { text: integrante.nombreintegrante || 'N/A', style: 'tableCell', alignment: 'center' }, // Nombre del integrante
        { text: integrante.cargo || 'N/A', style: 'tableCell', alignment: 'center' }, // Cargo
        { text: integrante.rol || 'N/A', style: 'tableCell', alignment: 'center' }, // Rol
        { text: integrante.contacto || 'N/A', style: 'tableCell', alignment: 'center' } // Contacto
      ]);

      // Consola para ver cómo se va llenando el array 'rows'
      //console.log(`Fila ${index + 1} añadida:`, rows[index]);
    }
    // Consola para ver todo el array 'rows' generado
    //console.log('Todas las filas generadas:', JSON.stringify(rows, null, 2));   

    // Consola para ver el array completo después de que se hayan agregado todas las filas
    //console.log('Filas generadas:', rows);

    // Generar las filas de la tabla
    let rows2 = [];
    for (let index = 0; index < this.data['integrantes'].length; index += 2) {
      const integrante1 = this.data['integrantes'][index];
      const integrante2 = this.data['integrantes'][index + 1];
      console.log(`Procesando integrante ${index + 1}:`, integrante1);

      rows2.push([
        {
          text: `_________________________________________________________\n ${integrante1.nombreintegrante}\nASESOR TÉCNICO DE GESTIÓN HUMANA\n${this.nombreEmpresa.toUpperCase()}.`, // Primer texto
          alignment: 'center',
          fontSize: 8,
          margin: [0, 40, 0, 0]
        },
        integrante2
          ? {
              text: `_________________________________________________________\n ${integrante2.nombreintegrante}\nASESOR TÉCNICO DE RESPUESTA FRENTE A EMERGENCIAS VIALES\n${this.nombreEmpresa.toUpperCase()}.`, // Segundo texto
              alignment: 'center',
              fontSize: 8,
              margin: [0, 40, 0, 0]
            }
          : {
              text: "", // Si no hay un segundo integrante, dejar la celda vacía
              alignment: 'center',
              fontSize: 8,
              margin: [0, 40, 0, 0]
            }
      ]);
    }

    
    // Define el contenido del PDF
    const documentDefinition = {
      pageSize: 'LETTER', // Tamaño carta (8.5 x 11 pulgadas)
      pageMargins: [72, 85, 72, 71], // Márgenes: Izquierda, Superior, Derecha, Inferior
      content: [
        { text: 'COMITÉ DE SEGURIDAD VIAL', style: 'header' },
        { text: '\n\n' },
        { text: `En la ciudad de ${this.data['ciudad'].toUpperCase()}, del departamento de ${this.data['departamento'].toUpperCase()}, al día (${fechaArray[2]}) del mes de ${fechaArray[1]} del ${fechaArray[0]} se reúnen las personas que han sido designadas por la gerencia para conformar el comité de seguridad vial de la empresa ${this.nombreEmpresa.toUpperCase()} y delegar las funciones correspondientes a sus roles dentro de este y así dar cumplimiento a la RESOLUCIÓN 40595 DE 2022.`, style: 'normal', alignment: 'justify' },
        { text: '\n' },
        { text: `El comité de seguridad vial estará constituido por los integrantes que se relacionan a continuación:`, style: 'normal', alignment: 'justify' },
        { text: '\n' },
        {
          style: 'tableExample',
          table: {
            headerRows: 1,
            widths: [20, '*', 75, '*', 65], // Distribución igual de ancho para cada columna
            body: [
              [
                { text: 'No.', style: 'tableHeader', alignment: 'center' },
                { text: 'INTEGRANTES', style: 'tableHeader', alignment: 'center' },
                { text: 'CARGO', style: 'tableHeader', alignment: 'center' },
                { text: 'ROL', style: 'tableHeader', alignment: 'center' },
                { text: 'CONTACTO', style: 'tableHeader', alignment: 'center' }
              ],
              ...rows
            ]
          },
          layout: 'lightHorizontalLines' // Estilo de líneas horizontales claras para la tabla
        },
        { text: '\n' },
        { text: '1. OBJETIVOS DEL COMITÉ DE SEGURIDAD VIAL', style: 'subtitulo' },
        { text: '\n' },
        {
          ul: [
            { text: 'Analizar los resultados obtenidos producto de los indicadores utilizados para el desarrollo del PESV y formular la ruta a seguir para reforzar los aspectos favorables encontrados, mitigar riesgos y diseñar acciones para garantizar una movilidad segura para todos los actores viales de la organización.', alignment: 'justify', style: 'separoUL' },
            { text: 'Plantear, diseñar, implementar y medir las acciones que permitan generar conciencia entre el personal y lograr objetivos a favor de la seguridad vial en la empresa y la vida cotidiana de sus integrantes.', alignment: 'justify', style: 'separoUL' }
          ],
          margin: [20, 0, 0, 0] // Ajuste del margen izquierdo para desplazar la lista a la derecha
        },
        { text: '\n' },
        { text: '2. FUNCIONES Y RESPONSABILIDADES DEL COMITÉ DE SEGURIDAD VIAL', style: 'subtitulo' },
        { text: '\n' },
        { text: `El Comité de Seguridad Vial será el responsable de diseñar, definir, programar y gestionar todos los aspectos necesarios para implementación del Plan Estratégico de Seguridad Vial de ${this.nombreEmpresa.toUpperCase()} al mismo tiempo que ejercerá como un ente estratégico en el proceso de participación para la planeación y ejecución las distintas fases del plan en mención. Dentro de sus principales funciones se relacionan:`, style: 'normal', alignment: 'justify' },
        { text: '\n' },
        {
          ul: [
            { 
              text: 'Definir la visión, los objetivos y alcances del Plan Estratégico de Seguridad Vial de la organización acorde con los mínimos establecidos por la autoridad correspondiente.', 
              alignment: 'justify', 
              style: 'separoUL' 
            },
            { 
              text: 'Realizar las acciones tendientes a diseñar, implementar y mejorar continuamente el Plan Estratégico de Seguridad Vial, involucrando a todos los actores viales de la empresa.', 
              alignment: 'justify', 
              style: 'separoUL' 
            },
            { 
              text: 'Analizar los resultados obtenidos en el diagnóstico inicial y formular la hoja de ruta a seguir, conducentes a reforzar los aspectos favorables encontrados, mitigar los riesgos y diseñar acciones para garantizar un cambio de actitud en los diversos actores de movilidad en la entidad.', 
              alignment: 'justify', 
              style: 'separoUL' 
            },
            { 
              text: 'Presentar, discutir y determinar los programas académicos a desarrollar con los distintos actores.', 
              alignment: 'justify', 
              style: 'separoUL' 
            },
            { 
              text: 'Promover la participación de colaboradores y comunidad en las acciones de la seguridad vial.', 
              alignment: 'justify', 
              style: 'separoUL' 
            },
            { 
              text: 'Evaluar los requerimientos y la oferta disponible, frente a proveedores y talleres para los procesos de diagnóstico, mantenimiento preventivo y mantenimiento correctivo de los vehículos de la entidad.', 
              alignment: 'justify', 
              style: 'separoUL' 
            },
            { 
              text: 'Programar fechas, tiempos y lugares para las capacitaciones con los conductores y operadores.', 
              alignment: 'justify', 
              style: 'separoUL' 
            },
            { 
              text: 'Determinar las acciones de control o auditorías viales que se consideren pertinentes.', 
              alignment: 'justify', 
              style: 'separoUL' 
            },
            { 
              text: 'Presentar campañas educativas y acciones de acompañamiento (actividades) para desarrollar durante todo el año.', 
              alignment: 'justify', 
              style: 'separoUL' 
            },
            { 
              text: 'Garantizar la aplicación y recursos que permitan el cumplimiento de la política de seguridad vial.', 
              alignment: 'justify', 
              style: 'separoUL' 
            },
            { 
              text: 'Definir la competencia en seguridad vial de los colaboradores de la empresa y establecer un Plan Anual de Formación que permita la gestión del conocimiento por cada actor vial y, asegurando el cumplimiento de este.', 
              alignment: 'justify', 
              style: 'separoUL' 
            },
            { 
              text: 'Documentar y aplicar técnicas, metodologías y/o procedimientos para la investigación interna de siniestros viales. Los cuales permitan, determinar los planes de acción que eliminen, sustituyan o mitiguen el(los) riesgo(s) generador del evento.', 
              alignment: 'justify', 
              style: 'separoUL' 
            },
            { 
              text: 'Elaborar, analizar y aprobar los informes periodísticos para la gerencia, Ministerio de Transporte, Organismos de Tránsito u otros interesados, que den cuenta de las acciones programadas, adelantadas y por ejecutar, analizando el impacto, costo-beneficio y aporten en la generación de hábitos, comportamientos y conductas favorables a la seguridad vial del país.', 
              alignment: 'justify', 
              style: 'separoUL' 
            },
            { 
              text: 'Programar y ejecutar una auditoria anual interna, la cual permita evaluar el cumplimiento y estado del PESV.', 
              alignment: 'justify', 
              style: 'separoUL' 
            },
            { 
              text: 'Definir e implementar acciones correctivas y/o preventivas necesarias con base al análisis de indicadores, resultados de auditorías y visitas de verificación del PESV.', 
              alignment: 'justify', 
              style: 'separoUL' 
            },
            { 
              text: 'Establecer los canales de comunicación que permitan la promoción, divulgación y comunicación de resultados y controles adoptados por la empresa con el fin de mejorar el nivel de seguridad vial.', 
              alignment: 'justify', 
              style: 'separoUL' 
            },
            { 
              text: 'Suspender de manera inmediata todos los actos inseguros que afecten las condiciones de seguridad vial que se desarrollen dentro del proyecto, teniendo autoridad sobre vehículos propios, proveedores y contratistas, teniendo en cuenta la licencia interna cuenta con tres puntos, los cuales serán perforados por el Comité de Seguridad vial, cada vez que un conductor sea sorprendido cometiendo alguna infracción.', 
              alignment: 'justify', 
              style: 'separoUL' 
            }
          ],
          margin: [20, 0, 0, 0] // Ajuste del margen izquierdo para desplazar la lista a la derecha
        },
        { text: '\n' },
        { text: '3. ROLES Y FUNCIONES', style: 'subtitulo' },
        { text: '\n' },
        { text: '3.1.	ALTA DIRECCIÓN', style: 'subsubtitulo' },
        { text: '\n' },
        {
          ul: [
            { 
              text: 'Liderar el proceso de diseño, implementación, seguimiento y mejora del Plan Estratégico de Seguridad Vial.', 
              alignment: 'justify', 
              style: 'separoUL' 
            },
            { 
              text: 'Involucrar un representante de los diferentes procesos de la organización según su pertinencia, con el fin de participar en la creación y difusión de los objetivos de la seguridad vial.', 
              alignment: 'justify', 
              style: 'separoUL' 
            },
            { 
              text: 'Expedir un documento que permita identificar la política de Seguridad vial de la entidad.', 
              alignment: 'justify', 
              style: 'separoUL' 
            },
            { 
              text: 'Establecer y asegurar el presupuesto necesario para la implementación y mejora de las diferentes medidas que se vayan a adoptar.', 
              alignment: 'justify', 
              style: 'separoUL' 
            },
            { 
              text: 'Establecer un proceso eficaz de participación de los colaboradores en las diferentes actividades relacionadas con la gestión de la seguridad vial.', 
              alignment: 'justify', 
              style: 'separoUL' 
            },
            { 
              text: 'Garantizar a los grupos de trabajo el tiempo que precisen para sus reuniones.', 
              alignment: 'justify', 
              style: 'separoUL' 
            },
            { 
              text: 'Adoptar las decisiones oportunas que hagan posible que se lleven a buen término las medidas que se propongan.', 
              alignment: 'justify', 
              style: 'separoUL' 
            },
            { 
              text: 'Garantizar que el personal que labora en cada proceso cumpla con lo establecido en el Sistema de Gestión del Plan Estratégico de Seguridad Vial.', 
              alignment: 'justify', 
              style: 'separoUL' 
            }
          ],
          margin: [20, 0, 0, 0] // Ajuste del margen izquierdo para desplazar la lista a la derecha
        },
        { text: '\n' },
        { text: '3.2.	LÍDER DEL PESV', style: 'subsubtitulo' },
        { text: '\n' },
        {
          ul: [
            { 
              text: 'Garantizar el cumplimiento de las etapas de planificación, implementación, seguimiento y mejora del PESV.', 
              alignment: 'justify', 
              style: 'separoUL' 
            },
            { 
              text: 'Diligenciar el reporte de autogestión anual y los resultados de la medición de los indicadores del Plan Estratégico de Seguridad Vial.', 
              alignment: 'justify', 
              style: 'separoUL' 
            },
            { 
              text: 'Gestionar la consecución de recursos financieros, administrativos y humanos necesarios para la planificación e implementación del Plan Estratégico de Seguridad Vial.', 
              alignment: 'justify', 
              style: 'separoUL' 
            },
            { 
              text: 'Presidir las reuniones ordinarias o extraordinarias del Comité de Seguridad Vial.', 
              alignment: 'justify', 
              style: 'separoUL' 
            },
            { 
              text: 'Establecer mecanismos de vigilancia que garanticen el cumplimiento de los objetivos y metas del Plan Estratégico de Seguridad Vial.', 
              alignment: 'justify', 
              style: 'separoUL' 
            },
            { 
              text: 'Establecer las acciones correctivas y/o preventivas que permitan gestionar las no conformidades y/o acciones de mejora de las auditorías internas y externas al Plan Estratégico de Seguridad Vial.', 
              alignment: 'justify', 
              style: 'separoUL' 
            }
          ],
          margin: [20, 0, 0, 0] // Ajuste del margen izquierdo para desplazar la lista a la derecha
        },
        { text: '\n' },
        { text: '3.3.	SECRETARIO TÉCNICO', style: 'subsubtitulo' },
        { text: '\n' },
        {
          ul: [
            { 
              text: 'Elaborar, reunir y presentar la información o documentación necesaria para el estudio o asuntos competencia del Comité de Seguridad Vial.', 
              alignment: 'justify', 
              style: 'separoUL' 
            },
            { 
              text: 'Presentar informes periódicos al Comité de Seguridad Vial, los cuales permitan evidenciar el cumplimiento del Plan Anual de Trabajo, Plan Anual de Formación y metas.', 
              alignment: 'justify', 
              style: 'separoUL' 
            },
            { 
              text: 'Realizar el análisis estadístico de siniestros viales y verificar el cumplimiento de los planes de acción establecidos.', 
              alignment: 'justify', 
              style: 'separoUL' 
            },
            { 
              text: 'Presentar informes de los programas de desempeño implementados, los cuales permitan evidenciar la eficacia de estos.', 
              alignment: 'justify', 
              style: 'separoUL' 
            }
          ],
          margin: [20, 0, 0, 0] // Ajuste del margen izquierdo para desplazar la lista a la derecha
        },
        { text: '\n' },
        { text: '3.4.	ASESOR TÉCNICO DE GESTIÓN HUMANA', style: 'subsubtitulo' },
        { text: '\n' },
        {
          ul: [
            { 
              text: 'Mantener actualizado el perfil del cargo de conductor, definidas las competencias requeridas para el cargo, así como garantizar su cumplimiento.', 
              alignment: 'justify', 
              style: 'separoUL' 
            },
            { 
              text: 'Asegurar la implementación del Proceso de Selección de Conductores, incluida la realización de los exámenes Psicosensométricos con el CRC y la prueba teórica y práctica con el CEA seleccionado.', 
              alignment: 'justify', 
              style: 'separoUL' 
            },
            { 
              text: 'Garantizar la ejecución de los cursos solicitados para la operación segura de vehículos: Manejo defensivo, operación de vehículos 4X4 (si aplica) y primeros auxilios básicos.', 
              alignment: 'justify', 
              style: 'separoUL' 
            },
            { 
              text: 'Realizar el control sobre la documentación del personal (conductor), asegurando su vigencia.', 
              alignment: 'justify', 
              style: 'separoUL' 
            },
            { 
              text: 'Realizar las revisiones periódicas en el SIMIT y/o RUNT, con el fin de verificar la imposición de sanciones y/o multas por incumplimiento de las normas de seguridad vial, por parte de las autoridades competentes.', 
              alignment: 'justify', 
              style: 'separoUL' 
            },
            { 
              text: 'Notificar a Talento Humano, el incumplimiento de las políticas y directrices de Seguridad Vial por parte de los trabajadores (si las hubiese), para que se aplique el procedimiento de conformidad al Reglamento Interno de Trabajo.', 
              alignment: 'justify', 
              style: 'separoUL' 
            },
            { 
              text: 'Realizar el reporte del cumplimiento y cobertura del Plan Anual de Formación en materia de seguridad vial.', 
              alignment: 'justify', 
              style: 'separoUL' 
            }
          ],
          margin: [20, 0, 0, 0] // Ajuste del margen izquierdo para desplazar la lista a la derecha
        },
        { text: '\n' },
        { text: '3.5.	ASESOR TÉCNICO DE INFRAESTRUCTURA', style: 'subsubtitulo' },
        { text: '\n' },
        {
          ul: [
            { 
              text: 'Programar y verificar la ejecución de las actividades de mantenimiento y mejora de las vías internas de la organización, garantizando unas condiciones óptimas para la circulación de los diferentes actores viales.', 
              alignment: 'justify', 
              style: 'separoUL' 
            },
            { 
              text: `Establecer condiciones básicas mínimas para la circulación de peatones en las vías internas de ${this.nombreEmpresa.toUpperCase()}.`, 
              alignment: 'justify', 
              style: 'separoUL' 
            },
            { 
              text: `Realizar análisis de riesgos de la infraestructura vial interna destinada para la circulación de peatones y vehículos automotores propios o al servicio de ${this.nombreEmpresa.toUpperCase()}.`, 
              alignment: 'justify', 
              style: 'separoUL' 
            },
            { 
              text: `Garantizar la disposición de señalización y dispositivos de regulación de tránsito de acuerdo con las necesidades y riesgos de las vías internas de ${this.nombreEmpresa.toUpperCase()} cumpliendo con lo establecido en la normatividad vigente.`, 
              alignment: 'justify', 
              style: 'separoUL' 
            }
          ],
          margin: [20, 0, 0, 0] // Ajuste del margen izquierdo para desplazar la lista a la derecha
        },
        { text: '\n' },
        { text: '3.6.	ASESOR TÉCNICO DE MANTENIMIENTO Y OPERACIÓN', style: 'subsubtitulo' },
        { text: '\n' },
        {
          ul: [
            { 
              text: 'Garantizar la ejecución del mantenimiento preventivo de los vehículos propios de la empresa y/o al servicio de esta, de conformidad a lo establecido en el programa de mantenimiento de la organización.', 
              alignment: 'justify', 
              style: 'separoUL' 
            },
            { 
              text: `Inspeccionar el cumplimiento de requisitos establecidos en el plan estratégico de seguridad vial de ${this.nombreEmpresa.toUpperCase()}, para vehículos propios, contratistas o visitantes.`, 
              alignment: 'justify', 
              style: 'separoUL' 
            },
            { 
              text: 'Establecer condiciones básicas mínimas para los desplazamientos laborales.', 
              alignment: 'justify', 
              style: 'separoUL' 
            },
            { 
              text: `Documentar los procedimientos para la planificación de los desplazamientos laborales de los colaboradores ${this.nombreEmpresa.toUpperCase()}.`, 
              alignment: 'justify', 
              style: 'separoUL' 
            },
            { 
              text: 'Identificación de rutas críticas, de acuerdo con los indicadores de siniestralidad vial.', 
              alignment: 'justify', 
              style: 'separoUL' 
            },
            { 
              text: 'Realizar seguimiento a los reportes de control emitidos por el sistema de control de la organización GPS.', 
              alignment: 'justify', 
              style: 'separoUL' 
            },
            { 
              text: 'Realizar el seguimiento a la ejecución y registro de las inspecciones preoperacionales de los vehículos y equipos.', 
              alignment: 'justify', 
              style: 'separoUL' 
            }
          ],
          margin: [20, 0, 0, 0] // Ajuste del margen izquierdo para desplazar la lista a la derecha
        },
        { text: '\n' },
        { text: '3.7.	ASESOR TÉCNICO DE RESPUESTAS FRENTE A EMERGENCIAS VIALES', style: 'subsubtitulo' },
        { text: '\n' },
        {
          ul: [
            { 
              text: 'Elaborar, reunir y presentar la información correspondiente a emergencias viales presentadas para el estudio o asuntos competencia del Comité de Seguridad Vial.', 
              alignment: 'justify', 
              style: 'separoUL' 
            },
            { 
              text: 'Realizar los registros correspondientes de las investigaciones de los accidentes de tránsito presentados, y así mismo hacer seguimiento a la ejecución de los Planes de Acción definidos.', 
              alignment: 'justify', 
              style: 'separoUL' 
            },
            { 
              text: 'Mantener actualizados e implementados los protocolos de atención a emergencias viales, de conformidad a los riesgos, amenazas y/o eventos que se presenten.', 
              alignment: 'justify', 
              style: 'separoUL' 
            },
            { 
              text: 'Realizar seguimiento a la implementación de la metodología o procedimiento establecida para la investigación interna de siniestros viales.', 
              alignment: 'justify', 
              style: 'separoUL' 
            },
            { 
              text: `Garantizar la divulgación de las lecciones aprendidas de los siniestros viales en los que se ven involucrados los colaboradores de ${this.nombreEmpresa.toUpperCase()}.`, 
              alignment: 'justify', 
              style: 'separoUL' 
            }
          ],
          margin: [20, 0, 0, 0] // Ajuste del margen izquierdo para desplazar la lista a la derecha
        },
        { text: '\n' },
        { text: '4. FRECUENCIA DE REUNIONES DEL COMITÉ DE SEGURIDAD VIAL', style: 'subtitulo' },
        { text: '\n' },
        { text: `Se establecen reuniones ordinarias de manera trimestral para este comité y reuniones extraordinarias en los siguientes casos:`, style: 'normal', alignment: 'justify' },
        {
          ul: [
            { 
              text: 'Si se presenta algún siniestro vial que involucre lesionados o fallecidos.', 
              alignment: 'justify', 
              style: 'separoUL' 
            },
            { 
              text: 'Si se evidencia un aumento de incidentes o accidentes viales.', 
              alignment: 'justify', 
              style: 'separoUL' 
            },
            { 
              text: 'Si se evidencia un aumento del riesgo en términos de seguridad vial.', 
              alignment: 'justify', 
              style: 'separoUL' 
            }
          ],
          margin: [20, 0, 0, 0] // Ajuste del margen izquierdo para desplazar la lista a la derecha
        },
        { text: `Para cada reunión realizada por este comité de seguridad vial se deja un acta donde se especifica lo desarrollado.`, style: 'normal', alignment: 'justify' },
        { text: '\n' },
        { text: `Firmado el día (${fechaArray[2]}) del mes de ${fechaArray[1]} del ${fechaArray[0]}, por los miembros del Comité de Seguridad Vial:`, style: 'normal', alignment: 'justify' },
        { text: '\n' },
        {
          table: {
            widths: ['50%', '50%'], // Dos columnas de igual tamaño
            body: rows2
              // [
              //   // {
              //   //   text: `_________________________________________________________\n ${this.data['ciudad'].toUpperCase()}\nASESOR TÉCNICO DE GESTIÓN HUMANA\n${this.nombreEmpresa.toUpperCase()}.`, // Primer texto
              //   //   alignment: 'center', // Centrado horizontal
              //   //   fontSize: 8
              //   // },
              //   // {
              //   //   text: `_________________________________________________________\n ${this.data['ciudad'].toUpperCase()}\nASESOR TÉCNICO DE RESPUESTA FRENTE A EMERGENCIAS VIALES\n${this.nombreEmpresa.toUpperCase()}.`, // Segundo texto
              //   //   alignment: 'center', // Centrado horizontal
              //   //   fontSize: 8
              //   // }
              // ]
            
          },
          layout: 'noBorders' // No mostrar bordes de la tabla
        },
      
      ],
      styles: {
        header: {
          fontSize: 18,
          bold: true,
          alignment: 'center',
          margin: [0, 0, 0, 0]
        },
        subtitulo: {
          fontSize: 12,
          decoration: 'underline', // Estilo subrayado
          margin: [0, 0, 0, 10]
        },
        subheader: {
          fontSize: 16,
          bold: true,
          color: '#4CAF50',
          margin: [0, 10, 0, 5]
        },
        normal: {
          fontSize: 12,
          margin: [0, 0, 0, 10]
        },
        signature: {
          fontSize: 12,
          italics: true,
          margin: [0, 20, 0, 0]
        },
        tableHeader: {
          fontSize: 10,
          bold: true,
          color: 'black',
          fillColor: '#eeeeee'
        },
        tableCell: {
          fontSize: 8,
          margin: [0, 5, 0, 5]
        },
        separoUL: {
          margin: [0, 0, 0, 10]
        }
      }
    };

    // Genera y abre el PDF

    if(this.descargaOprevia === "vista"){
      pdfMake.createPdf(documentDefinition).open();
    }else if(this.descargaOprevia === "descarga"){

      const fechaActual = new Date().toISOString().split('T')[0]; // Formato: YYYY-MM-DD
      const nombreArchivo = `${fechaActual}.pdf`;

      pdfMake.createPdf(documentDefinition).download(nombreArchivo); //pdfMake.createPdf(documentDefinition).download(['holasdf.pdf']);

    }else if(this.descargaOprevia === "imprimir"){
      pdfMake.createPdf(documentDefinition).print();
    }
    

    // Generar el PDF como un Blob y subirlo
    if (subirBlob){
      pdfMake.createPdf(documentDefinition).getBlob((blob:any) => {
      
        this._comiteSeguridadVial.uploadPdfToFirebase(blob,this.idFormulario);

      });
    }
    

  }

  descomponerFecha(fecha: string): string[] {
    // Dividimos la fecha por el carácter '-' para obtener año, mes y día
    const [ano, mesNumero, dia] = fecha.split("-");
  
    // Array con los nombres de los meses
    const meses = [
      "enero", "febrero", "marzo", "abril", "mayo", "junio",
      "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
    ];
  
    // Convertimos el número del mes en texto
    const mes = meses[parseInt(mesNumero, 10) - 1];
  
    // Retornamos el arreglo con el año, el mes y el día
    return [ano, mes, dia];
  }

}
