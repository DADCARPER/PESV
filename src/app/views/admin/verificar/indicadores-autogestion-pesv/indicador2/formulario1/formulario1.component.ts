import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-formulario1',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './formulario1.component.html',
  styleUrl: './formulario1.component.css'
})
export class Formulario1Component {

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
