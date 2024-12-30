import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { PoliticaSeguridadVialService } from '../../../services/politica-seguridad-vial.service';

@Component({
  selector: 'app-pdf-politicas-seguridad-vial',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pdf-politicas-seguridad-vial.component.html',
  styleUrl: './pdf-politicas-seguridad-vial.component.css'
})
export class PdfPoliticasSeguridadVialComponent implements OnInit {

  private _politicaSeguridadVial = inject(PoliticaSeguridadVialService);

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

      const dataCruda = await this._politicaSeguridadVial.getfomularioEdit(this.idFormulario);

        console.log("datacrudaaaaaaaaaaa",dataCruda);
      if (dataCruda['fechaDocumento'] != "") {// valido si un parametro obligatorio esta en el objeto. en caso de no estar es por que no existe el docuemnto
        
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

    //console.log("verver",this.data['fechaDocumento']);

    const fechaArray = this.descomponerFecha(this.data['fechaDocumento']);

    

    
    // Define el contenido del PDF
    const documentDefinition = {
      pageSize: 'LETTER', // Tamaño carta (8.5 x 11 pulgadas)
      pageMargins: [72, 85, 72, 71], // Márgenes: Izquierda, Superior, Derecha, Inferior
      content: [
        { text: 'POLÍTICA DE SEGURIDAD VIAL', style: 'header' },
        { text: '\n\n' },
        { text: `La seguridad vial ha cobrado una gran importancia dado el problema de salud pública que representa la siniestralidad vial a nivel mundial y específicamente para el caso colombiano, es por esto que partiendo de la premisa “La pérdida de una vida en un accidente de tránsito es inaceptable” , ${this.nombreEmpresa.toUpperCase()} en el marco del desarrollo de sus actividades, se compromete a fomentar una cultura de seguridad vial en todos los niveles de la organización, involucrando a todos los colaboradores y visitantes de la empresa, promocionando el cumplimiento de la normatividad vigente y procedimientos internos establecidos en el Plan Estratégico de Seguridad Vial, con el fin de propender una movilidad segura  y prevenir accidentes e incidentes viales , tanto en las vías internas como en las vías externas del complejo minero.`, style: 'normal', alignment: 'justify' },
        { text: '\n' },
        { text: `${this.nombreEmpresa.toUpperCase()} en cumplimiento con lo establecido en la ley 1503 de 2011 del Ministerio de Transporte, se compromete con la planificación e implementación del Sistema de gestión Plan Estratégico de Seguridad Vial que garantice una mejora continua en el nivel de seguridad vial de la empresa, mitigando los riesgos identificados, definiendo las competencias de cada actor vial, controlando y verificando periódicamente el estado de los vehículos al servicio de la organización y garantizando el cumplimiento de los cronogramas de mantenimiento de los mismo; Se intermediara en la generación, concientización de la responsabilidad y el cumplimiento del marco normativo establecido en el Código Nacional de Tránsito Terrestre.`, style: 'normal', alignment: 'justify' },
        { text: '\n' },
        { text: `La organización destinará los recursos financieros, humanos y técnicos necesarios para dar cumplimiento a la política de seguridad vial y a la mejora continua de la gestión en seguridad vial; e igualmente impondrá sanciones o medidas disciplinarias ante el incumplimiento o la omisión de la presente política. `, style: 'normal', alignment: 'justify' },
        { text: '\n' },
        { text: `Firmado el día ${fechaArray[2]} de ${fechaArray[1]} del ${fechaArray[0]}, por los miembros del Comité de Seguridad Vial:`, style: 'normal', alignment: 'justify' },
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
      
        this._politicaSeguridadVial.uploadPdfToFirebase(blob,this.idFormulario);

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
