import { CommonModule } from '@angular/common';
import { Component, signal, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthenticacionService } from '../../../../../../services/shared/authenticacion.service';
import { FirestoreService } from '../../../../../../services/shared/firestore.service';
import { AlertaService } from '../../../../../../services/shared/alerta.service';

@Component({
  selector: 'app-form2-vehiculos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './form2-vehiculos.component.html',
  styleUrl: './form2-vehiculos.component.css'
})
export class Form2VehiculosComponent {

  private _auth = inject(AuthenticacionService);
  private _firestore = inject(FirestoreService);
  public _alerta = inject(AlertaService);

  mostrarModal = signal<boolean>(false);
  docLegalForm: FormGroup;

  vehiculoId = '';
  placa = '';

  constructor(private fb: FormBuilder) {
    this.docLegalForm = this.fb.group({
      vigenciaSoat:             ['', Validators.required],
      vigenciaRevisionTecnica:  ['', Validators.required],
      entidadAseguradora:       ['', Validators.required],
    });
  }

  cerrarModal() {
    this.docLegalForm.reset({
      vigenciaSoat: '', vigenciaRevisionTecnica: '', entidadAseguradora: '',
    });
    this.mostrarModal.set(false);
  }

  abrirModal(vehiculo: any) {
    this.vehiculoId = vehiculo.id;
    this.placa = vehiculo.placa ?? '';
    this.docLegalForm.patchValue({
      vigenciaSoat:            vehiculo.vigenciaSoat            ?? '',
      vigenciaRevisionTecnica: vehiculo.vigenciaRevisionTecnica ?? '',
      entidadAseguradora:      vehiculo.entidadAseguradora      ?? '',
    });
    this.mostrarModal.set(true);
  }

  async handleSave() {
    if (!this.docLegalForm.valid) {
      this._alerta.showWarning('Por favor, completa todos los campos.');
      return;
    }
    const nit = this._auth.getCurrentUser().displayName;
    const periodo = this._auth.periodo();
    const path = `Empresas/${nit}/periodos/${periodo}/006-diagnostico-vehiculos/${this.vehiculoId}`;
    try {
      await this._firestore.updateDocument(path, this.docLegalForm.value);
      this._alerta.showSuccess('Documentación legal guardada exitosamente.');
      this.cerrarModal();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error al guardar';
      console.error('[Form2Vehiculos] handleSave:', error);
      this._alerta.showError(msg);
    }
  }

  handleCancel() { this.cerrarModal(); }
}
