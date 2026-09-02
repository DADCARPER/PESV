import { CommonModule } from '@angular/common';
import { Component, signal, inject } from '@angular/core';
import { FirestoreService } from '../../../../../services/shared/firestore.service';
import { AuthenticacionService } from '../../../../../services/shared/authenticacion.service';
import { AlertaService } from '../../../../../services/shared/alerta.service';
import { Models } from '../../../../../interfaces/models';

@Component({
  selector: 'app-form2-competencia',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './form2-competencia.component.html',
  styleUrl: './form2-competencia.component.css'
})
export class Form2CompetenciaComponent {

  private _authcations = inject(AuthenticacionService);
  private _firestore = inject(FirestoreService);
  public _alerta = inject(AlertaService);

  eliminarDoc: Models.Formacion.ConsultarCompetencia | null = null;
  mostrarModal = signal<boolean>(false);

  abrirModal(dato: Models.Formacion.ConsultarCompetencia) {
    this.eliminarDoc = dato;
    this.mostrarModal.set(true);
  }

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
        `Empresas/${nit}/periodos/${periodo}/010-competencia-plan-anual-formacion-competencias/${this.eliminarDoc.id}`,
        { estado: 'NoActivo' }
      );
      this._alerta.showSuccess('Competencia eliminada exitosamente.');
      this.cerrarModal();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error al eliminar';
      console.error('[Form2Competencia] eliminar:', error);
      this._alerta.showError(msg);
    }
  }

  handleCancel() {
    this.cerrarModal();
  }
}
