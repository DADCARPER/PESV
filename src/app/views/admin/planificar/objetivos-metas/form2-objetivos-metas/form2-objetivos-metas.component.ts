import { CommonModule } from '@angular/common';
import { Component, signal, inject } from '@angular/core';
import { FirestoreService } from '../../../../../services/shared/firestore.service';
import { AuthenticacionService } from '../../../../../services/shared/authenticacion.service';
import { AlertaService } from '../../../../../services/shared/alerta.service';
import { Models } from '../../../../../interfaces/models';

@Component({
  selector: 'app-form2-objetivos-metas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './form2-objetivos-metas.component.html',
  styleUrl: './form2-objetivos-metas.component.css'
})
export class Form2ObjetivosMetasComponent {

  private _authcations = inject(AuthenticacionService);
  private _firestore = inject(FirestoreService);
  public _alerta = inject(AlertaService);

  eliminarDoc: Models.ObjetivosMetas.ConsultarObjetivo | null = null;

  // Signal para controlar la visibilidad del modal
  mostrarModal = signal<boolean>(false);

  // Método para abrir el modal
  abrirModal(objetivo: Models.ObjetivosMetas.ConsultarObjetivo) {
    this.eliminarDoc = objetivo;
    this.mostrarModal.set(true);
  }

  // Método para cerrar el modal
  cerrarModal() {
    this.eliminarDoc = null;
    this.mostrarModal.set(false);
  }

  async handleSave() {
    if (!this.eliminarDoc) return;

    const nit = this._authcations.getCurrentUser().displayName;
    const periodo = this._authcations.periodo();

    try {
      await this._firestore.updateDocument(
        `Empresas/${nit}/periodos/${periodo}/007-objetivos-metas/${this.eliminarDoc.id}`,
        { estado: 'NoActivo' }
      );
      this._alerta.showSuccess('Objetivo eliminado exitosamente.');
      this.cerrarModal();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error al eliminar el objetivo';
      console.error('[Form2ObjetivosMetas] eliminar:', error);
      this._alerta.showError(msg);
    }
  }

  // Método para manejar el clic en "Cancelar"
  handleCancel() {
    this.cerrarModal();
  }

}
