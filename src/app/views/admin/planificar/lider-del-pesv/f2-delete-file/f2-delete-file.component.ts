import { CommonModule } from '@angular/common';
import { Component, signal, inject } from '@angular/core';
import { FirestoreService } from '../../../../../services/shared/firestore.service';
import { AuthenticacionService } from '../../../../../services/shared/authenticacion.service';
import { AlertaService } from '../../../../../services/shared/alerta.service';

@Component({
  selector: 'app-f2-delete-file',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './f2-delete-file.component.html',
  styleUrl: './f2-delete-file.component.css'
})
export class F2DeleteFileComponent {

  private _authcations = inject(AuthenticacionService);
  private _firestore = inject(FirestoreService);
  public _alerta = inject (AlertaService);

  elminarDoc:any;

  // Signal para controlar la visibilidad del modal
  mostrarModal = signal<boolean>(false);

  async handleSave() {
    //console.log('ID del documento a eliminar----->>>',this.elminarDoc.id);
    const uid = this._authcations.getCurrentUser().uid;
    const nit = this._authcations.getCurrentUser().displayName;
    await this._firestore.updateDocument(`Empresas/${nit}/documentos/${this.elminarDoc}`, {estado: 'NoActivo'});
    try {
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
