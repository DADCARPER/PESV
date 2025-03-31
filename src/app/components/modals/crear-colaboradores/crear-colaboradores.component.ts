import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-crear-colaboradores',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './crear-colaboradores.component.html',
  styleUrl: './crear-colaboradores.component.css'
})
export class CrearColaboradoresComponent {

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
