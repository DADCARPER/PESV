import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { LiderazgoCompromisoService } from '../../../services/liderazgo-compromiso.service';

@Component({
  selector: 'app-pdf-liderazgo-compromiso',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pdf-liderazgo-compromiso.component.html',
  styleUrl: './pdf-liderazgo-compromiso.component.css'
})
export class PdfLiderazgoCompromisoComponent {

  private _liderazgoCompromiso = inject(LiderazgoCompromisoService);
  
    @Input() mostrarBotones: boolean = false;
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
  
        const dataCruda = await this._liderazgoCompromiso.getfomularioEdit(this.idFormulario);
  
        console.log("datacrudaaaaaaaaaaa",dataCruda);

        this.data = dataCruda;
        //console.log( 'xsxsxsxs'+this.data);

        console.log('Datos cargados en el formulario:', this.data); //data['cargoLider']

        console.log('SI HAY FORMULARIO')
      }else{
        console.log('NO HAY FORMULARIO');
      }
    }
  
    async generatePdf(subirBlob:boolean): Promise<void> {
  
      
  
      await this.llamodatosFormulario();
  
      //console.log("verver",this.data['fechaDocumento']);
  
      const fechaArray = this.descomponerFecha('2000-10-02');
  
      
  
      
      // Define el contenido del PDF
      const documentDefinition = {
        pageSize: 'LETTER', // Tamaño carta (8.5 x 11 pulgadas)
        pageMargins: [72, 85, 72, 71], // Márgenes: Izquierda, Superior, Derecha, Inferior
        content: [
          { text: 'COMPROMISO Y CORRESPONSABILIDAD DEL NIVEL DIRECTIVO', style: 'header' },
          { text: '\n\n' },
          { text: '1. RESPONSABILIDADES EN SEGURIDAD VIAL EN CADA NIVEL ORGANIZACIONAL', style: 'subtitulo' },
          { text: `Comprometidos con el bienestar de cada colaborador de MIRO SEGURIDAD LTDA.  y el cumplimiento de la normatividad vigente aplicable, la organización se ha comprometido a establecer lineamientos tendientes a la promoción de una Cultura de seguridad vial, con el objetivo de prevenir siniestros de tránsito durante los desplazamientos en misión de sus colaboradores en vías públicas o privadas abiertas al público.`, style: 'normal', alignment: 'justify' },
          { text: `Es responsabilidad del nivel directivo de MIRO SEGURIDAD LTDA. el diseño, implementación y seguimiento continuo del Plan Estratégico De Seguridad Vial (PESV), para lo cual se requiere la coordinación y apoyo de:`, style: 'normal', alignment: 'justify' },
          { text: '\n' },
          {
            ul: [
              { 
                text: 'Líder del Plan Estratégico De Seguridad Vial (PESV).', 
                alignment: 'justify', 
                style: 'separoUL' 
              },
              { 
                text: `Comité De Seguridad Vial (CSV).`, 
                alignment: 'justify', 
                style: 'separoUL' 
              },
              { 
                text: 'Líderes de cada regional operativa.', 
                alignment: 'justify', 
                style: 'separoUL' 
              },
              { 
                text: `COPASST o Vigía de Seguridad y Salud en el Trabajo.`, 
                alignment: 'justify', 
                style: 'separoUL' 
              },
              { 
                text: 'Brigada integral de seguridad.', 
                alignment: 'justify', 
                style: 'separoUL' 
              },
              { 
                text: 'Empleados y colaboradores.', 
                alignment: 'justify', 
                style: 'separoUL' 
              },
              { 
                text: 'Subcontratistas y proveedores.', 
                alignment: 'justify', 
                style: 'separoUL' 
              }
            ],
            margin: [20, 0, 0, 0] // Ajuste del margen izquierdo para desplazar la lista a la derecha
          },
          { text: `Por lo anterior, todo el personal independiente de su cargo o labor, los contratistas, subcontratistas y en especial el personal propio provistos con vehículos de la organización o de terceros para el ejercicio de su labor diaria, son responsables de cumplir con lo establecido dentro del Plan Estratégico De Seguridad Vial (PESV) y del Sistema de Gestión de la Seguridad y Salud en el Trabajo (SG-SST) en la organización, cada área o responsable tendrá entre otras, las siguientes obligaciones:`, style: 'normal', alignment: 'justify' },
          { text: '\n' },
          { text: '1.1.	NIVEL DIRECTIVO ', style: 'subtitulo' },
          { text: `El nivel directivo de la organización demostrará su liderazgo, compromiso y corresponsabilidad mediante las siguientes acciones:`, style: 'normal', alignment: 'justify' },
          { text: '\n' },
          {
            ul: [
              { 
                text: 'De la mano del líder del Plan Estratégico De Seguridad Vial (PESV) y el comité de seguridad vial (CSV) definirá la política y los objetivos del Plan Estratégico De Seguridad Vial (PESV) siendo estos compatibles con la dirección estratégica de la organización, buscando prevenir siniestros viales y mejorar los estándares de seguridad vial para cada uno de los desplazamientos generados con fin misional.', 
                alignment: 'justify', 
                style: 'separoUL' 
              },
              { 
                text: `Promover en la organización la formación y aplicación de hábitos, comportamientos y conductas seguras en la vía.`, 
                alignment: 'justify', 
                style: 'separoUL' 
              },
              { 
                text: 'El suministro de recursos financieros, técnicos y humanos requeridos para el diseño, implementación, verificación y mejora del PESV.', 
                alignment: 'justify', 
                style: 'separoUL' 
              },
              { 
                text: `La adquisición o contratación de vehículos, equipos, repuestos y servicios que cumplan especificaciones de seguridad, de acuerdo con la normatividad vigente en la materia.`, 
                alignment: 'justify', 
                style: 'separoUL' 
              },
              { 
                text: 'El cumplimiento de las acciones y estrategias definidas en el plan de trabajo anual del PESV.', 
                alignment: 'justify', 
                style: 'separoUL' 
              },
              { 
                text: 'La atención oportuna de la solicitud de información por parte de las entidades verificadoras, la participación en la reunión de apertura y reunión de cierre y la gestión de los hallazgos resultantes de las visitas de verificación que realicen el Ministerio de Trabajo, con la función de verificación de la implementación del Plan Estratégico de Seguridad Vial de conformidad con lo establecido en el artículo 1° de la Ley 2050 de 2020 y las disposiciones que lo reglamenten.', 
                alignment: 'justify', 
                style: 'separoUL' 
              },
              { 
                text: 'La participación en una (1) reunión del comité de seguridad vial por lo menos una (1) vez al año para revisar los resultados de la planificación, implementación, seguimiento y mejora del PESV.', 
                alignment: 'justify', 
                style: 'separoUL' 
              },
              { 
                text: 'Garantizar la consulta y participación de los empleados en la identificación de los peligros y control de los riesgos viales, así como la participación de grupos de apoyo.', 
                alignment: 'justify', 
                style: 'separoUL' 
              },
              { 
                text: 'Implementar los correctivos necesarios para el cumplimiento de metas y objetivos del Plan Estratégico De Seguridad Vial (PESV).', 
                alignment: 'justify', 
                style: 'separoUL' 
              },
              { 
                text: 'Garantizar la disponibilidad de personal competente para liderar y controlar el desarrollo del Plan Estratégico De Seguridad Vial (PESV).', 
                alignment: 'justify', 
                style: 'separoUL' 
              },
              { 
                text: 'Garantizar un programa de formación y entrenamiento para los empleados con funciones de movilidad, tránsito y transporte terrestre que ingresen a la empresa, independientemente de su forma de contratación y vinculación.', 
                alignment: 'justify', 
                style: 'separoUL' 
              },
              { 
                text: 'Garantizar un programa de capacitación acorde con las necesidades específicas detectadas en la identificación de peligros, evaluación y valoración de riesgos según sea el medio de movilización', 
                alignment: 'justify', 
                style: 'separoUL' 
              },
              { 
                text: 'Garantizar información oportuna sobre la gestión de la seguridad vial y canales de comunicación que permitan recolectar información manifestada por los empleados.', 
                alignment: 'justify', 
                style: 'separoUL' 
              },
              { 
                text: 'Nombrar un líder del Plan Estratégico De Seguridad Vial (PESV).', 
                alignment: 'justify', 
                style: 'separoUL' 
              },
              { 
                text: 'Conformar e informar al Comité de Seguridad Vial del proceso del Plan Estratégico De Seguridad Vial (PESV).', 
                alignment: 'justify', 
                style: 'separoUL' 
              },
              { 
                text: 'Definir la estructura organizativa para elaborar el Plan Estratégico De Seguridad Vial (PESV).', 
                alignment: 'justify', 
                style: 'separoUL' 
              },
              { 
                text: 'Coordinar y promover la gestión de alianzas y relaciones externas cuando sea necesario.', 
                alignment: 'justify', 
                style: 'separoUL' 
              }
            ],
            margin: [20, 0, 0, 0] // Ajuste del margen izquierdo para desplazar la lista a la derecha
          },
          { text: `Firmado el día ${fechaArray[2]} de ${fechaArray[1]} del ${fechaArray[0]}, por los miembros del Comité de Seguridad Vial:`, style: 'normal', alignment: 'justify' },
          { text: '\n\n\n\n\n' },
          { text: `_________________________________________________________\n ${this.data['objetivo1']}\nASESOR TÉCNICO DE GESTIÓN HUMANA\n${this.nombreEmpresa.toUpperCase()}.`, style: 'normal', alignment: 'center' },
        
        ],
        styles: {
          header: {
            fontSize: 16,
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
        
          this._liderazgoCompromiso.uploadPdfToFirebase(blob,this.idFormulario);
  
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
