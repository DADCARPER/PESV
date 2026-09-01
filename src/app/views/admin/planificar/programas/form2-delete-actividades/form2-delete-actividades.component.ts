import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthenticacionService } from '../../../../../services/shared/authenticacion.service';
import { FirestoreService } from '../../../../../services/shared/firestore.service';
import { AlertaService } from '../../../../../services/shared/alerta.service';


@Component({
  selector: 'app-form2-delete-actividades',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './form2-delete-actividades.component.html',
  styleUrl: './form2-delete-actividades.component.css'
})
export class Form2DeleteActividadesComponent {

  private _authcations = inject(AuthenticacionService);
  private _firestore = inject(FirestoreService);
  public _alerta = inject (AlertaService);

  elminarDoc:any;

  // Signal para controlar la visibilidad del modal
  mostrarModal = signal<boolean>(false);

  async handleSave() {
    console.log('ID del documento a eliminar----->>>',this.elminarDoc.id);
    const nit = this._authcations.getCurrentUser().displayName;
    try {
      const periodo = this._authcations.periodo();
      await this._firestore.updateDocument(`Empresas/${nit}/periodos/${periodo}/008-actividades-gestion-riesgos/${this.elminarDoc.id}`, {estado: 'NoActivo'});
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
  abrirModal(idDocumento:string) { // crear o editar
    //console.log('Abril el modal Eliminar----->>>',idDocumento)
    this.elminarDoc = idDocumento;
    this.mostrarModal.set(true);
  }
}
