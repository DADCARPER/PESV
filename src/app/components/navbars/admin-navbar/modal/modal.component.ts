import { CommonModule } from '@angular/common';
import { Component, EventEmitter, signal, Output } from '@angular/core';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.css'
})
export class ModalComponent {

  @Output() datoRecibido = new EventEmitter<any>();

  periodo = signal<number>(0);

  // Signal para controlar la visibilidad del modal
  mostrarModal = signal<boolean>(false);

  async handleSave() {
    this.datoRecibido.emit(this.periodo());
    this.cerrarModal();
    }

  // Método para manejar el clic en "Cancelar"
  handleCancel() {
    this.datoRecibido.emit(false);
    this.cerrarModal();
  }
  
  // Método para cerrar el modal
  cerrarModal() {
    this.mostrarModal.set(false);
  }

  // Método para abrir el modal
  abrirModal(periodo: number) { // crear o editar
    this.periodo.set(periodo);
    this.mostrarModal.set(true);
  }
}
