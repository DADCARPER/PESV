import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { CargarDocumentosComponent } from "../../../../../shared/cargar-documentos/cargar-documentos.component";


@Component({
  selector: 'app-gestion-archivos',
  standalone: true,
  imports: [CommonModule, CargarDocumentosComponent],
  templateUrl: './gestion-archivos.component.html',
  styleUrl: './gestion-archivos.component.css'
})
export class GestionArchivosComponent {

  

}
