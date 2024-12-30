import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { ObjetivosMetasService } from '../../../services/objetivos-metas.service';

@Component({
  selector: 'app-pdf-objetivos-metas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pdf-objetivos-metas.component.html',
  styleUrl: './pdf-objetivos-metas.component.css'
})
export class PdfObjetivosMetasComponent {

  private _objetivosMetas = inject(ObjetivosMetasService);
  
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
  
        const dataCruda = await this._objetivosMetas.getfomularioEdit(this.idFormulario);
  
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
  
      //const fechaArray = this.descomponerFecha(this.data['fechaDocumento']);
  
      
  
      
      // Define el contenido del PDF
      const documentDefinition = {
        pageSize: 'LETTER', // Tamaño carta (8.5 x 11 pulgadas)
        pageMargins: [72, 85, 72, 71], // Márgenes: Izquierda, Superior, Derecha, Inferior
        content: [
          { text: 'OBJETIVOS Y METAS DEL PESV ', style: 'header' },
          { text: '\n\n' },
          { text: '1. OBJETIVOS ', style: 'subtitulo' },
          { text: `Estructurar estrategias de gestión del riesgo vial acordes a las características de operación y de los vehículos empleados para los desplazamientos en misión e in itinere, las cuales permitan fomentar una cultura de prevención en seguridad vial en los colaboradores de MIRO SEGURIDAD LTDA. garantizando desplazamientos mas seguros.`, style: 'normal', alignment: 'justify' },
          { text: '\n' },
          {
            ul: [
              { 
                text: 'Concientizar a los colaboradores de MIRO SEGURIDAD LTDA independientemente de su rol en la vía de la responsabilidad como usuarios de la misma por medio de campañas y formación en seguridad vial.', 
                alignment: 'justify', 
                style: 'separoUL' 
              },
              { 
                text: `Fortalecer e incrementar los estándares de seguridad vial en los colaboradores, implementando un cronograma de formación y programas de gestión del riesgo vial.`, 
                alignment: 'justify', 
                style: 'separoUL' 
              },
              { 
                text: 'Verificar el comportamiento de los conductores de MIRO SEGURIDAD LTDA, realizando seguimiento periódico a las plataformas del SIMIT y RUNT.', 
                alignment: 'justify', 
                style: 'separoUL' 
              },
              { 
                text: `Documentar e implementar los procedimientos y protocolos que permitan planificar, realizar seguimiento y medir la efectividad del plan de trabajo estructurado.`, 
                alignment: 'justify', 
                style: 'separoUL' 
              },
              { 
                text: 'Establecer canales de comunicación directos entre los colaboradores y los diferentes niveles de la organización, con el fin de mitigar riesgos esporádicos, condiciones y comportamientos inseguros.', 
                alignment: 'justify', 
                style: 'separoUL' 
              }
            ],
            margin: [20, 0, 0, 0] // Ajuste del margen izquierdo para desplazar la lista a la derecha
          },

          { text: '\n' },
          { text: '2. METAS ', style: 'subtitulo' },
          { text: '\n' },
          {
            ul: [
              { 
                text: 'Minimizar los peligros que puedan causar accidentes o lesiones.', 
                alignment: 'justify', 
                style: 'separoUL' 
              },
              { 
                text: `Asegurar que el plan se ejecute según lo previsto.`, 
                alignment: 'justify', 
                style: 'separoUL' 
              },
              { 
                text: 'Promover el uso del cinturón de seguridad y otros dispositivos de protección.', 
                alignment: 'justify', 
                style: 'separoUL' 
              },
              { 
                text: `Asegurar que los vehículos estén en óptimas condiciones.`, 
                alignment: 'justify', 
                style: 'separoUL' 
              },
              { 
                text: 'Capacitar a los conductores en técnicas de conducción segura.', 
                alignment: 'justify', 
                style: 'separoUL' 
              }
            ],
            margin: [20, 0, 0, 0] // Ajuste del margen izquierdo para desplazar la lista a la derecha
          },
          { text: '\n' },
          { text: `La organización destinará los recursos financieros, humanos y técnicos necesarios para dar cumplimiento a la política de seguridad vial y a la mejora continua de la gestión en seguridad vial; e igualmente impondrá sanciones o medidas disciplinarias ante el incumplimiento o la omisión de la presente política. `, style: 'normal', alignment: 'justify' },
          { text: '\n' },
          //{ text: `Firmado el día ${fechaArray[2]} de ${fechaArray[1]} del ${fechaArray[0]}, por los miembros del Comité de Seguridad Vial:`, style: 'normal', alignment: 'justify' },
          { text: '\n\n\n\n\n' },
          { text: `_________________________________________________________\n ${this.nombreEmpresa.toUpperCase()}\nASESOR TÉCNICO DE GESTIÓN HUMANA\n${this.nombreEmpresa.toUpperCase()}.`, style: 'normal', alignment: 'center' },
        
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
        
          this._objetivosMetas.uploadPdfToFirebase(blob,this.idFormulario);
  
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
