import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { DiagnosticoImportComponent } from "../../importsExcel/diagnostico-import/diagnostico-import.component";
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-importar-colaboradores',
  standalone: true,
  imports: [CommonModule, DiagnosticoImportComponent, RouterLink],
  templateUrl: './importar-colaboradores.component.html',
  styleUrl: './importar-colaboradores.component.css'
})
export class ImportarColaboradoresComponent {

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
