import { Component, inject, signal } from '@angular/core';
import { Models } from '../../../../../interfaces/models';
import { AuthenticacionService } from '../../../../../services/shared/authenticacion.service';
import { FirestoreService } from '../../../../../services/shared/firestore.service';
import { AlertaService } from '../../../../../services/shared/alerta.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-form5-eliminar-actividad',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './form5-eliminar-actividad.component.html',
  styleUrl: './form5-eliminar-actividad.component.css'
})
export class Form5EliminarActividadComponent {

  private _authcations = inject(AuthenticacionService);
  private _firestore = inject(FirestoreService);
  public _alerta = inject (AlertaService);

  elminarDoc: Models.PlanTrabajo.ConsultarPlanTrabajoActividades | null = null;

  // Signal para controlar la visibilidad del modal
  mostrarModal = signal<boolean>(false);

  async handleSave() {
    console.log('ID del documento a eliminar----->>>',this.elminarDoc.id);
    const nit = this._authcations.getCurrentUser().displayName;
    try {
      await this._firestore.updateDocument(`Empresas/${nit}/009-plan-anual-trabajo-actividades/${this.elminarDoc.id}`, {estado: 'NoActivo'});
      this._alerta.showSuccess('Registro eliminado exitosamente.');
      this.cerrarModal(); // Cerrar el modal después de guardar
    } catch (error) {
      this._alerta.showError('No se elimino el registro. Conexión Internet Fallo');
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
  abrirModal(actividad: Models.PlanTrabajo.ConsultarPlanTrabajoActividades) {
    this.elminarDoc = actividad;
    this.mostrarModal.set(true);
  }
  
}
