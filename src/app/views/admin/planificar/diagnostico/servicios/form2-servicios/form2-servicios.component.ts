import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { AuthenticacionService } from '../../../../../../services/shared/authenticacion.service';
import { FirestoreService } from '../../../../../../services/shared/firestore.service';
import { AlertaService } from '../../../../../../services/shared/alerta.service';

@Component({
  selector: 'app-form2-servicios',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './form2-servicios.component.html',
  styleUrl: './form2-servicios.component.css'
})
export class Form2ServiciosComponent {

  private _authcations = inject(AuthenticacionService);
  private _firestore = inject(FirestoreService);
  public _alerta = inject (AlertaService);

  elminarDoc:any;

  // Signal para controlar la visibilidad del modal
  mostrarModal = signal<boolean>(false);

  async handleSave() {
    const nit = this._authcations.getCurrentUser().displayName;
    const periodo = this._authcations.periodo();
    try {
      await this._firestore.updateDocument(`Empresas/${nit}/periodos/${periodo}/006-diagnostico-servicios/${this.elminarDoc.id}`, { estado: 'NoActivo' });
      this._alerta.showSuccess('Registro eliminado exitosamente.');
      this.cerrarModal();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error al eliminar el servicio';
      console.error('[Form2Servicios] eliminar:', error);
      this._alerta.showError(msg);
    }
  }

  // Método para manejar el clic en "Cancelar"
  handleCancel() {
    this.cerrarModal();
  }
  
  // Método para cerrar el modal
  cerrarModal() {
    this.mostrarModal.set(false);
  }

  // Método para abrir el modal
  abrirModal(idDocumento:string) { // crear o editar
    //console.log('Abril el modal Eliminar----->>>',idDocumento)
    this.elminarDoc = idDocumento;
    this.mostrarModal.set(true);
  }

}
