import { Component, inject, signal, effect, Input } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';

import { SharedService } from './shared.service';
import { Archivos } from '../../interfaces/perfil.interface';
import { RouterLink } from '@angular/router';
import { SubirArchivosComponent } from '../../components/otros/subir-archivos/subir-archivos.component';
import { CardArchivoComponent, } from '../../components/cards/card-archivo/card-archivo.component';
import { CargardocumentoService } from './cargardocumento.service';


@Component({
  selector: 'app-cargar-documentos',
  standalone: true,
  imports: [CommonModule, SubirArchivosComponent, CardArchivoComponent, RouterLink],
  templateUrl: './cargar-documentos.component.html',
  styleUrl: './cargar-documentos.component.css'
})
export class CargarDocumentosComponent {

  @Input() coleccionFirebase: string = ''; 
  @Input() coleccionStorage: string = ''; 
  @Input() rutaRetorno: string = '';
  @Input() titulobloque: string = '';

  private _cargardocumentos = inject(CargardocumentoService);
  private _shared = inject(SharedService)
  private _datePipe = inject(DatePipe);

  documentos = signal<Archivos[]>([]);
  
  constructor() {
    
    
    // Detectar cuando se sube un nuevo archivo
    effect(() => {
      if (this._shared.getActualizarTabla()()) {
        this.cargarDocumento();
        //this._shared.resetActualizacion();
      }
    });
  }

  ngOnInit(){

    // Carga inicial
    this.cargarDocumento();
    
  }

  async cargarDocumento() {
    try {
      
      const data = await this._cargardocumentos.getDocDiagnostico(this.coleccionFirebase);
      // Convertir a array si es necesario
      const docsArray = Object.values(data || {}).map(doc => ({
        ...doc,
        fechaCreacion: doc.fechaCreacion.toDate(),
        fechaFormateada: this._datePipe.transform(doc.fechaCreacion.toDate(), 'd MMMM yyyy', '', 'es-ES'),
        horaFormateada: this._datePipe.transform(doc.fechaCreacion.toDate(), 'h:mm a', '', 'es-ES')
      }))
      .sort((a, b) => b.fechaCreacion.getTime() - a.fechaCreacion.getTime());
      this.documentos.set(docsArray); // Asumiendo que quieres mostrar como array
      console.log('Documentos cargados:', docsArray);
    } catch (error) {
      console.error('Error al cargar documento:', error);
      this.documentos.set([]);
    }
  }
}
