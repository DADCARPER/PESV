import { Component, Input, OnInit, inject } from '@angular/core';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { LiderDelPesvService } from '../../../services/lider-del-pesv.service';
import { CommonModule } from '@angular/common';

//pdfMake.vfs = pdfFonts.pdfMake.vfs;

@Component({
  selector: 'app-pdf-lider-pesv',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pdf-lider-pesv.component.html',
  styleUrl: './pdf-lider-pesv.component.css'
})
export class PdfLiderPesvComponent implements OnInit {

  private  liderDelPesvService = inject(LiderDelPesvService);

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

   
      const dataCruda = await this.liderDelPesvService.getfomularioEdit(this.idFormulario,this.idusuario);
      console.log( dataCruda);
        if (dataCruda.exists()) {
          
          this.data = dataCruda.data();
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

    const fechaArray = this.descomponerFecha(this.data['fechaDesignacion']);

    // Define el contenido del PDF
    const documentDefinition = {
      pageSize: 'LETTER', // Tamaño carta (8.5 x 11 pulgadas)
      pageMargins: [72, 85, 72, 71], // Márgenes: Izquierda, Superior, Derecha, Inferior
      content: [
        { text: 'LÍDER DEL DISEÑO E IMPLEMENTACIÓN DEL PESV', style: 'header' },
        { text: '\n\n' },
        { text: `El representante legal de ${this.nombreEmpresa.toUpperCase()}, identificada con el NIT: ${this.data['nitEmpresa'].toUpperCase()}, ha designado a ${this.data['nombreLider'].toUpperCase()} y quien desempeña el cargo de ${this.data['cargoLider'].toUpperCase()} al interior de la organización, como representante de la Alta Dirección y líder del diseño e implementación del Plan Estratégico de Seguridad Vial (PESV) de La organización, de acuerdo con lo establecido en la Resolución 40595 de 2022 del Ministerio de Transporte “Por la cual se adopta la metodología para el diseño, implementación y verificación de los Planes Estratégicos de Seguridad Vial y se dictan otras disposiciones”. En ese sentido y dentro del marco de esta designación, le corresponde realizar lo siguiente:`, style: 'normal', alignment: 'justify' },
        { text: '\n\n' },
        {
          ul: [
            { text: 'Liderar el proceso de diseño e implementación del PESV, velando por el cumplimiento integral de todos los requisitos establecidos en cada una de las fases del sistema de gestión.', alignment: 'justify', style: 'separoUL' },
            { text: 'Deberá realizar el reporte de autogestión anual, resultados de los indicadores de gestión del PESV, así como el resultado de la auditoría interna. Este reporte se debe realizar de acuerdo a las fechas fijadas en la normatividad legal vigente.', alignment: 'justify', style: 'separoUL' },
            { text: 'Asegurar el presupuesto necesario para la implementación de las estrategias y/o programas de gestión del riesgo vial adoptadas por la organización.', alignment: 'justify', style: 'separoUL' },
            { text: 'Responder a solicitudes y realizar el respectivo acompañamiento cuando lo requieran las autoridades competentes en materia de seguridad vial.', alignment: 'justify', style: 'separoUL' },
            { text: 'Informar a la alta dirección sobre el funcionamiento, resultados y acciones de mejora requeridas por el PESV.', alignment: 'justify', style: 'separoUL' },
            { text: 'Definir y asegurar el cumplimiento de las actividades designadas en el Plan anual de trabajo y el plan de formación.', alignment: 'justify', style: 'separoUL' }
          ],
          margin: [20, 0, 0, 0] // Ajuste del margen izquierdo para desplazar la lista a la derecha
        },
        { text: '\n\n' },
        { text: `Este documento se firma al día (${fechaArray[2]}) del mes de ${fechaArray[1]} de ${fechaArray[0]}.`, style: 'normal' },
        { text: '\n\n' },
        {
          columns: [
            { text: `_______________________________\n ${this.data['representanteLegal'].toUpperCase()}\nRepresentante legal\n${this.nombreEmpresa.toUpperCase()}.`, style: 'signature' },
            { text: `_______________________________\n ${this.data['nombreLider'].toUpperCase()} \n ${this.data['cargoLider']} \n ${this.nombreEmpresa.toUpperCase()}.`, style: 'signature', alignment: 'right' }
          ]
        },
        { text: '', pageBreak: 'after' },

        // Página 2
        { text: '\n' },
        { text: '1. LÍDER DEL DISEÑO E IMPLEMENTACIÓN DEL PESV', style: 'subtitulo' },
        { text: '\n' },
        { text: 'De acuerdo con lo establecido en la resolución 20223040040595 del 12 de julio de 2022 emitida por el Ministerio de Transporte de Colombia, el líder del diseño e implementación del Plan Estratégico de Seguridad Vial (PESV) deberá contar con la disponibilidad de tiempo para implementar las actividades del Plan y verificar su cumplimiento por cada área de la organización.', style: 'normal', alignment: 'justify' },
        { text: '\n' },
        { text: 'Se debe seleccionar al responsable con objetividad, ya que esta persona es esencial como centralizadora de las actividades del Plan Estratégico de Seguridad Vial (PESV). En los casos en que se nombre a un directivo, su control debe ser eficiente y continuo, y contar con la disposición para seguir diariamente la implementación. Un responsable del PESV distante, que solo lleva a cabo sus labores esporádicamente, no es adecuado.', style: 'normal', alignment: 'justify' },
        { text: '\n' },
        { text: '1.1. IDONEIDAD Y COMPETENCIA', style: 'subsubtitulo' },
        { text: '\n' },
        { text: 'Debido a que la metodología planteada por la resolución 20223040040595 del 12 de julio de 2022 realiza la integración del Plan Estratégico de Seguridad Vial (PESV), el Sistema de Gestión de Seguridad y Salud en el Trabajo (SG-SST), y la norma internacional ISO 39001:2012 bajo el ciclo PHVA (Planear, Hacer, Verificar y Actuar), por medio del cual se diseña, implementa y verifica el Plan Estratégico de Seguridad Vial. El líder del Plan Estratégico de Seguridad Vial (PESV) deberá reunir las siguientes habilidades y competencias:', style: 'normal', alignment: 'justify' },
        { text: '\n' },
        { text: '1.1.1. HABILIDADES', style: 'subsubtitulo' },
        { text: '\n' },
        {
          ul: [
            { text: 'Contar con la autonomía necesaria para la toma de decisiones.', alignment: 'justify', style: 'separoUL' },
            { text: 'Tener a su alcance el manejo de los recursos para el cumplimiento de las actividades propuestas.', alignment: 'justify', style: 'separoUL' },
            { text: 'Relación directa con el personal propio y contratista, los departamentos y áreas responsables de operación y el transporte terrestre de la organización y el equipo de trabajo relacionado directo o indirectamente con el tema de la seguridad vial y la seguridad y la salud en el trabajo.', alignment: 'justify' , style: 'separoUL'},
            { text: 'Por sus estudios y experiencia tiene conocimiento relacionado en materia de este plan.', alignment: 'justify' , style: 'separoUL'}
          ],
          margin: [20, 0, 0, 0]
        },
        { text: '', pageBreak: 'after' },

        // Página 3
        
        { text: '1.1.2. COMPETENCIAS', style: 'subsubtitulo' },
        { text: '\n' },
        {
          ul: [
            { text: 'Título de grado obtenido como técnico, tecnólogo, administrador, profesional, ingeniero o especialista en Seguridad y Salud en el Trabajo (SST).', alignment: 'justify', style: 'separoUL' },
            { text: 'Contar con certificado de curso de cincuenta (50) horas o actualización de veinte (20) horas en el sistema de gestión de Seguridad y Salud en el Trabajo (50-20/ SG-SST).', alignment: 'justify', style: 'separoUL' },
            { text: 'Experiencia en manejo y liderazgo de mínimo dos (2) años en el sistema de gestión de Seguridad y Salud en el Trabajo (SG-SST).', alignment: 'justify', style: 'separoUL' },
            { text: 'Experiencia en manejo y liderazgo de mínimo dos (2) años en Planes Estratégicos de Seguridad Vial (PESV).', alignment: 'justify', style: 'separoUL' },
            { text: 'Certificados de formación en seguridad vial y temas afines.', alignment: 'justify', style: 'separoUL' }
          ],
          margin: [20, 0, 0, 0]
        },
        { text: '\n' },
        { text: '1.2. RESPONSABLE Y CRONOGRAMA DE ELECCIÓN DEL LÍDER DEL DISEÑO E IMPLEMENTACIÓN DEL PESV', style: 'subsubtitulo' },
        { text: '\n' },
        { text: 'El líder del Plan Estratégico de Seguridad Vial (PESV) será designado por el nivel directivo de la organización bianualmente y su designación será formalizada mediante acta de asignación del líder del Plan Estratégico de Seguridad Vial (PESV) donde se establecen sus funciones y deberá ir firmada por el nivel directivo de la organización (Gerencia) la cual será almacenada en la carpeta de información del líder del diseño e implementación del Plan Estratégico de Seguridad Vial (PESV) y en la hoja de vida del profesional designado.', style: 'normal', alignment: 'justify' },

        { text: '\n' },
        { text: '1.3.	INDICADORES Y PERIODICIDAD PARA LA MEDICIÓN', style: 'subsubtitulo' },
        { text: '\n' },
        { text: 'Para medir la eficacia del cumplimiento del plan de trabajo y la idoneidad del líder del Plan Estratégico de Seguridad Vial (PESV) de la organización, se requiere del seguimiento de indicadores que muestren el rendimiento y eficacia del Plan Estratégico de Seguridad Vial (PESV) de la organización. Así mismo se tendrán en cuenta los resultados obtenidos en la evaluación de desempeño al cargo realizada anualmente al líder del Plan Estratégico de Seguridad Vial (PESV) de la organización.', style: 'normal', alignment: 'justify' },
        { text: '\n' },
        { text: 'De acuerdo con lo anterior, los indicadores para el seguimiento de la elección e idoneidad del líder del Plan Estratégico de Seguridad Vial (PESV) serán los siguientes:', style: 'normal', alignment: 'justify' },
        { text: '', pageBreak: 'after' },
        // Página 4
        {
          style: 'tableExample',
          table: {
            headerRows: 1,
            widths: [95, '*', 50, 75], // Distribución igual de ancho para cada columna
            body: [
              [
                { text: 'INDICADOR', style: 'tableHeader', alignment: 'center' },
                { text: 'FÓRMULA', style: 'tableHeader', alignment: 'center' },
                { text: 'META', style: 'tableHeader', alignment: 'center' },
                { text: 'PERIODO DE MEDICIÓN', style: 'tableHeader', alignment: 'center' }
              ],
              [
                { text: 'Cumplimiento del plan de trabajo', style: 'tableCell', alignment: 'center' },
                { text: [
                  { text: 'Nº Actividades ejecutadas', fontSize: 8, alignment: 'center' },
                  { text: '\nCPAT  =  -----------------------------------------  * 100\n'},
                  { text: 'Nº Actividades programadas', fontSize: 8, alignment: 'center' },
                ], style: 'tableCell', alignment: 'center' }, // Campo vacío para fórmula
                { text: '90.00%', style: 'tableCell', alignment: 'center' },
                { text: 'Trimestral', style: 'tableCell', alignment: 'center' }
              ],
              [
                { text: 'Tasa de siniestralidad vial', style: 'tableCell', alignment: 'center' },
                { text: [
                  { text: 'Nº Accidentes trabajo al mes', fontSize: 8, alignment: 'center' },
                  { text: '\nTSV  =  --------------------------------------------  * 100\n'},
                  { text: 'Nº Colaboradores de la empresa', fontSize: 8, alignment: 'center' },
                ], style: 'tableCell', alignment: 'center' }, // Campo vacío para fórmula
                { text: '0.00%', style: 'tableCell', alignment: 'center' },
                { text: 'Mensual', style: 'tableCell', alignment: 'center' }
              ],
              [
                { text: 'Tasa de incidentes viales', style: 'tableCell', alignment: 'center' },
                { text: [
                  { text: 'Nº Incidentes viales al mes', fontSize: 8, alignment: 'center' },
                  { text: '\nTIV  =  -----------------------------------------------  * 100\n'},
                  { text: 'Nº Colaboradores de la empresa', fontSize: 8, alignment: 'center' },
                ], style: 'tableCell', alignment: 'center' }, // Campo vacío para fórmula
                { text: '3.00%', style: 'tableCell', alignment: 'center' },
                { text: 'Mensual', style: 'tableCell', alignment: 'center' }
              ],
              [
                { text: 'Gestión de no conformidades', style: 'tableCell', alignment: 'center' },
                { text: [
                  { text: 'Nº Conformidades gestionadas, cerradas', fontSize: 8, alignment: 'center' },
                  { text: '\nCPAT  =  -----------------------------------------------  * 100\n'},
                  { text: 'Nº Conformidades identificadas', fontSize: 8, alignment: 'center' },
                ], style: 'tableCell', alignment: 'center' }, // Campo vacío para fórmula
                { text: '100.00%', style: 'tableCell', alignment: 'center' },
                { text: 'Anual', style: 'tableCell', alignment: 'center' }
              ]
            ]
          },
          layout: 'lightHorizontalLines' // Estilo de líneas horizontales claras para la tabla
        }
        
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
          fontSize: 12,
          bold: true,
          color: 'black',
          fillColor: '#eeeeee'
        },
        tableCell: {
          fontSize: 10,
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
      
        this.liderDelPesvService.uploadPdfToFirebase(blob,this.idusuario,this.idFormulario);
  
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
