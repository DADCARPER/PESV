import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';


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
  @Input() tamano: string = 'regular'; //'small' | 'regular' | 'large' // Tamaño del modal
  @Input() cancelar: string = 'Cerrar'; // Título del modal
  @Input() ok: string = 'OK'; // Título del modal
  @Input() mostrarModal = false; // Controla si el modal está visible

  @Output() onSave = new EventEmitter<void>(); // Evento que emitiremos al hacer clic en "Save Changes"
  @Output() onCancel = new EventEmitter<void>(); // Evento que emitiremos al hacer clic en "Save Changes"

  ngOnInit(): void {
    
  }

  // Método para cerrar el modal
  cerrarModal() {
    this.mostrarModal = false;
    this.onCancel.emit(); // Añade esta línea
  }

  // Método para abrir el modal
  abrirModal() {
    this.mostrarModal = true;
  }

  // Método para manejar el clic en "Save Changes"
  handleSave() {
    this.onSave.emit(); // Emitir el evento
    this.cerrarModal(); // Cerrar el modal después de guardar
  }

  // Método para manejar el clic en "Cancelar"
  handleCancel() {
    this.onCancel.emit(); // Emitir el evento "onCancel"
    this.cerrarModal();
  }

}
