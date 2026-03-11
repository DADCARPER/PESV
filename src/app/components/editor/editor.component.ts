import { Component, Input, OnInit, OnChanges, inject, CUSTOM_ELEMENTS_SCHEMA, SimpleChanges } from '@angular/core';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import { CommonModule } from '@angular/common';
import { FormBuilder,FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import DecoupledEditor from '@ckeditor/ckeditor5-build-decoupled-document';

import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import htmlToPdfmake  from 'html-to-pdfmake';
import { Diseno1Service } from '../../services/pdfMake/diseno1.service';
import { AgregarImagenComponent } from "./agregar-imagen/agregar-imagen.component";

const nuevafuente = require('../../../assets/fonts/vfs_fonts.js');


@Component({
  selector: 'app-editor',
  standalone: true,
  imports: [CommonModule, CKEditorModule, ReactiveFormsModule, AgregarImagenComponent],
  schemas:[CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './editor.component.html',
  styleUrl: './editor.component.css'
})
export class EditorComponent implements OnInit, OnChanges {

  private _diseno1 = inject(Diseno1Service);

  @Input() recibeContenido: any;


  public imagen64: any = "";
  public headerdocumento: any = "";
  public totalFirmas = 0;
  public recibeURL: string = "";

  public Editor = DecoupledEditor;
  public editorData: string;
  public agregarDocumentoForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.agregarDocumentoForm = this.fb.group({
      titulodoc: [''],
      descripciondoc: [''],
      codigodoc: [''],
      fechadoc: [''],
      versiondoc: [''],
      imagen64doc: [''],
      encabezado: [false],
      totalFirmasdoc: [''],
      contenido: ['']
    });
  }

  async ngOnInit(){
    (pdfMake as any).vfs = {
      ...((pdfFonts as any).pdfMake ? (pdfFonts as any).pdfMake.vfs : (pdfFonts as any).vfs),
      ...nuevafuente
    };
    (pdfMake as any).fonts = {
      'OpenSans': {
        normal: 'OpenSans-Regular.ttf',
        bold: 'OpenSans-Bold.ttf',
        italics: 'OpenSans-Italic.ttf',
        bolditalics: 'OpenSans-BoldItalic.ttf'
      }
    };

  }

  ngOnChanges(changes: SimpleChanges) {

    // Verificamos si las propiedades 'recibeContenido' han cambiado
    if (changes['recibeContenido']) {
      let contenidoFinal = this.agregarDocumentoForm.get('contenido')?.value;  // Obtenemos el valor actual de 'contenido'

      // Si recibe contenido, lo agregamos al contenido final
      if (this.recibeContenido) {
        contenidoFinal += this.recibeContenido.texto;  // Concatenamos el nuevo contenido
      }

      // Actualizamos el valor de 'contenido' en el formulario
      this.agregarDocumentoForm.patchValue({
        contenido: contenidoFinal
      });
    }
  }

  onReady(editor: any) {
    // Coloca la barra de herramientas donde quieras
    const toolbarContainer = document.querySelector('.toolbar-container');
    if (toolbarContainer) {
      toolbarContainer.appendChild(editor.ui.view.toolbar.element);
    }
  }

  async mostrarHtml() {
    //console.log('URL Recibida: ->', this.recibeURL);
    
    if (this.agregarDocumentoForm.get('encabezado')?.value){
      this.agregarDocumentoForm.patchValue({
        imagen64doc: this.recibeURL,
      });
      
      console.log(this.agregarDocumentoForm.value);

    }else{
      console.log("Datos por defaul sin encabezado");
      console.log(this.agregarDocumentoForm.get('contenido')?.value);
    }
    
  }

  async generarPDF() {
    //obtener la imagen y la convierto en base64
    if (this.recibeURL){
      this.imagen64 = await this._diseno1.getBase64FromUrl(this.recibeURL);
    }else{
      this.imagen64 = await this._diseno1.getBase64FromUrl('https://firebasestorage.googleapis.com/v0/b/pesv-1ca41.appspot.com/o/Empresas%2Fdefault%2Fnoimagen.png?alt=media&token=0a9a1d74-c851-4287-b3b8-b8c64382ce10');
    }
    
    let htmlSinParrafos = this.agregarDocumentoForm.get('contenido')?.value.replace(/<p([^>]*)>/g, '<span$1>').replace(/<\/p>/g, '</span>');
    const pdfContent = htmlToPdfmake(htmlSinParrafos);

    // Bloque de firmas en PDFMake
    
    // const firmasPdfMake = {
    //   columns: [
    //     {
    //       width: '40%',
    //       stack: [
    //         { canvas: [ { type: 'line', x1: 0, y1: 0, x2: 180, y2: 0, lineWidth: 0.5 } ] },
    //         { text: 'REPRESENTANTE LEGAL', alignment: 'center', margin: [0, 5, 0, 0], fontSize: 8 }
    //       ]
    //     },
    //     { width: '20%', text: '' },
    //     {
    //       width: '40%',
    //       stack: [
    //         { canvas: [ { type: 'line', x1: 0, y1: 0, x2: 180, y2: 0, lineWidth: 0.5 } ] },
    //         { text: 'RESPONSABLE PESV', alignment: 'center', margin: [0, 5, 0, 0], fontSize: 8 }
    //       ]
    //     }
    //   ],
    //   margin: [0, 60, 0, 0]
    // };

    // // Une el contenido del editor con las firmas
    // const contenidoFinal = Array.isArray(pdfContent) ? [...pdfContent, firmasPdfMake] : [pdfContent, firmasPdfMake];

    const documentDefinition = {
      pageSize: 'LETTER',
      pageMargins: [85, 110, 85, 71],
      header: (currentPage:number, pageCount:number) => {
        // Llamar al servicio para obtener la cabecera
        if (this.agregarDocumentoForm.get('encabezado')?.value){
          const nuevaFecha = new Date(this.agregarDocumentoForm.get('fechadoc')?.value);
          // Convertir la fecha al formato DD/MM/YYYY
          const fechaFormateada = nuevaFecha.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });
          return this._diseno1.getCabecera1(currentPage, pageCount, this.agregarDocumentoForm.get('titulodoc')?.value,this.agregarDocumentoForm.get('descripciondoc')?.value,this.agregarDocumentoForm.get('codigodoc')?.value,fechaFormateada,this.agregarDocumentoForm.get('versiondoc')?.value,this.imagen64);
        }else{
          return {};
        }
      },
      //content: this._diseno1.cabecera1,
      content: pdfContent,
      defaultStyle: {
        font: 'OpenSans',
        fontSize: 11.5,
        lineHeight: 0.9
      },
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
          fontSize: 24,
          margin: [0, 0, 0, 10]
        },
        signature: {
          fontSize: 12,
          italics: true,
          margin: [0, 20, 0, 0]
        },
        // tableHeader: {
        //   fontSize: 10,
        //   bold: true,
        //   color: 'black',
        //   fillColor: '#eeeeee'
        // },
        // tableCell: {
        //   fontSize: 8,
        //   margin: [0, 5, 0, 5]
        // },
        tableCabecera:{
          fontSize: 8
        },
        separoUL: {
          margin: [0, 0, 0, 10]
        },
        fontSize: {
          fontSize: 12
        }
      }
    };

    pdfMake.createPdf(documentDefinition).open();
  }

  mostrarEncabezado() {
    if (this.agregarDocumentoForm.get('encabezado')?.value) {
      this.agregarDocumentoForm.get('encabezado')?.setValue(true);
    }else{
      this.agregarDocumentoForm.get('encabezado')?.setValue(false);
    }
    console.log(this.agregarDocumentoForm.get('encabezado')?.value);
  }

  limpiar() {
    //this.agregarDocumentoForm.reset();
    this.agregarDocumentoForm.patchValue({
      contenido: ''
    });

  }

}
