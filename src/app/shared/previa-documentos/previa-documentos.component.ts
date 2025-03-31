import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@Component({
  selector: 'app-previa-documentos',
  standalone: true,
  imports: [CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './previa-documentos.component.html',
  styleUrl: './previa-documentos.component.css'
})
export class PreviaDocumentosComponent {

}
