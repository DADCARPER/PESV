import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-formulario2',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './formulario2.component.html',
  styleUrl: './formulario2.component.css'
})
export class Formulario2Component {

  // Signal para controlar la visibilidad del modal
  mostrarModal = signal<boolean>(false);

    // Método para cerrar el modal
    cerrarModal() {
      this.mostrarModal.set(false);
      
    }
  
    // Método para abrir el modal
    abrirModal() {
      this.mostrarModal.set(true);
    }
  
    // Método para manejar el clic en "Save Changes"
    handleSave() {
      
      this.cerrarModal(); // Cerrar el modal después de guardar
    }
  
    // Método para manejar el clic en "Cancelar"
    handleCancel() {
      
      this.cerrarModal();
    }

}
