import { Component, inject, signal, effect } from '@angular/core';
import { CardArchivoComponent } from "../../../../../components/cards/card-archivo/card-archivo.component";
import { CommonModule, DatePipe } from '@angular/common';
import { DiagnosticoService } from '../../../../../services/diagnostico.service';
import { LoginService } from '../../../../../services/login.service';
import { Archivos } from '../../../../../interfaces/perfil.interface';
import { SubirArchivosComponent } from "../../../../../components/otros/subir-archivos/subir-archivos.component";
import { RouterLink } from '@angular/router';


@Component({
  selector: 'app-z-gestion-archivos',
  standalone: true,
  imports: [CommonModule, SubirArchivosComponent, CardArchivoComponent, RouterLink],
  templateUrl: './z-gestion-archivos.component.html',
  styleUrl: './z-gestion-archivos.component.css'
})
export class ZGestionArchivosComponent {

  private _uid = inject(LoginService)
  private _diagnosticoService = inject(DiagnosticoService);
  //private _shared = inject(SharedService)
  private _datePipe = inject(DatePipe);

  documentos = signal<Archivos[]>([]);
  
  // constructor() {
  //   // Carga inicial
  //   this.cargarDocumento();
    
  //   // Detectar cuando se sube un nuevo archivo
  //   effect(() => {
  //     if (this._shared.getActualizarTabla()()) {
  //       this.cargarDocumento();
  //       //this._shared.resetActualizacion();
  //     }
  //   });
  // }

  // async cargarDocumento() {
  //   try {
  //     const uid = this._uid.getUserId();
  //     const data = await this._diagnosticoService.getDocDiagnostico(uid!);
  //     // Convertir a array si es necesario
  //     const docsArray = Object.values(data || {}).map(doc => ({
  //       ...doc,
  //       fechaCreacion: doc.fechaCreacion.toDate(),
  //       fechaFormateada: this._datePipe.transform(doc.fechaCreacion.toDate(), 'd MMMM yyyy', '', 'es-ES'),
  //       horaFormateada: this._datePipe.transform(doc.fechaCreacion.toDate(), 'h:mm a', '', 'es-ES')
  //     }))
  //     .sort((a, b) => b.fechaCreacion.getTime() - a.fechaCreacion.getTime());
  //     this.documentos.set(docsArray); // Asumiendo que quieres mostrar como array
  //     console.log('Documentos cargados:', docsArray);
  //   } catch (error) {
  //     console.error('Error al cargar documento:', error);
  //     this.documentos.set([]);
  //   }
  // }

 
}
