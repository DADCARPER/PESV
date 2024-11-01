import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-modals-guia',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modals-guia.component.html',
  styleUrl: './modals-guia.component.css'
})
export class ModalsGuiaComponent {
  @Input() titulo: string = 'Modal Título'; // Título del modal
  @Input() contenido: string = 'Este es el contenido del modal.'; // Contenido del modal
  @Input() tamano: 'small' | 'regular' | 'large' = 'regular'; // Tamaño del modal
  mostrarModal = false; // Controla si el modal está visible

  // Método para cerrar el modal
  cerrarModal() {
    this.mostrarModal = false;
  }

  // Método para abrir el modal
  abrirModal() {
    this.mostrarModal = true;
  }
}
