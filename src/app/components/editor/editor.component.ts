import { Component, Input, OnInit, OnChanges, inject, CUSTOM_ELEMENTS_SCHEMA, SimpleChanges } from '@angular/core';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import { CommonModule } from '@angular/common';
import { FormBuilder,FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import DecoupledEditor from '@ckeditor/ckeditor5-build-decoupled-document';

import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import htmlToPdfmake  from 'html-to-pdfmake';
import { Diseno1Service } from '../../services/pdfMake/diseno1.service';
import { AlertaService } from '../../services/shared/alerta.service';
import { AgregarImagenComponent } from "./agregar-imagen/agregar-imagen.component";

const nuevafuente = require('../../../assets/fonts/vfs_fonts.js');

/**
 * Contenido que el editor recibe desde fuera.
 * `reemplazar` sustituye el documento entero (una plantilla nueva);
 * `agregar` lo concatena al final (un bloque de firmas).
 */
export interface ContenidoEditor {
  texto: string;
  time: string;
  modo?: 'reemplazar' | 'agregar';
}

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
  private _alerta = inject(AlertaService);

  @Input() recibeContenido: ContenidoEditor | null = null;
  /** Base del nombre con el que se descarga el PDF. */
  @Input() nombreArchivo = 'documento';


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
    // Sin texto no hay nada que hacer: evita concatenar vacíos en el primer enlace
    if (!changes['recibeContenido'] || !this.recibeContenido?.texto) return;

    const actual = this.agregarDocumentoForm.get('contenido')?.value ?? '';
    const modo = this.recibeContenido.modo ?? 'agregar';

    this.agregarDocumentoForm.patchValue({
      contenido: modo === 'reemplazar' ? this.recibeContenido.texto : actual + this.recibeContenido.texto
    });
  }

  onReady(editor: any) {
    // Coloca la barra de herramientas donde quieras
    const toolbarContainer = document.querySelector('.toolbar-container');
    if (toolbarContainer) {
      toolbarContainer.appendChild(editor.ui.view.toolbar.element);
    }
  }

  /** Genera el PDF y lo descarga. El usuario lo sube después al punto que corresponda. */
  async generarPDF() {
    const contenido: string = this.agregarDocumentoForm.get('contenido')?.value ?? '';
    if (!contenido.trim()) {
      this._alerta.showWarning('El documento está vacío. Elige una plantilla o escribe el contenido antes de descargar.');
      return;
    }

    // El logo solo hace falta si se va a pintar el encabezado, y su descarga
    // no puede impedir generar el PDF: si falla, se sigue sin logo. Antes se
    // pedia siempre una imagen remota por defecto, y su 403 abortaba todo.
    this.imagen64 = '';
    if (this.agregarDocumentoForm.get('encabezado')?.value && this.recibeURL) {
      try {
        this.imagen64 = await this._diseno1.getBase64FromUrl(this.recibeURL);
      } catch (error: unknown) {
        console.error('[Editor] logo del encabezado:', error);
        this._alerta.showWarning('No se pudo cargar el logo; el PDF se genera sin el.');
      }
    }

    const htmlSinParrafos = contenido.replace(/<p([^>]*)>/g, '<span$1>').replace(/<\/p>/g, '</span>');
    const pdfContent = htmlToPdfmake(htmlSinParrafos);

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

    const fecha = new Date().toISOString().slice(0, 10);
    pdfMake.createPdf(documentDefinition).download(`${this.nombreArchivo}-${fecha}.pdf`);
  }

  mostrarEncabezado() {
    if (this.agregarDocumentoForm.get('encabezado')?.value) {
      this.agregarDocumentoForm.get('encabezado')?.setValue(true);
    }else{
      this.agregarDocumentoForm.get('encabezado')?.setValue(false);
    }
  }

  limpiar() {
    this.agregarDocumentoForm.patchValue({
      contenido: ''
    });

  }

}
