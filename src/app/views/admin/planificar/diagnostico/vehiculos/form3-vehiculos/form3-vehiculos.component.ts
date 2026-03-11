import { CommonModule } from '@angular/common';
import { Component, signal, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthenticacionService } from '../../../../../../services/shared/authenticacion.service';
import { FirestoreService } from '../../../../../../services/shared/firestore.service';
import { AlertaService } from '../../../../../../services/shared/alerta.service';

@Component({
  selector: 'app-form3-vehiculos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './form3-vehiculos.component.html',
  styleUrl: './form3-vehiculos.component.css'
})
export class Form3VehiculosComponent {

  private _auth = inject(AuthenticacionService);
  private _firestore = inject(FirestoreService);
  public _alerta = inject(AlertaService);

  mostrarModal = signal<boolean>(false);
  operacionForm: FormGroup;

  vehiculoId = '';
  placa = '';

  constructor(private fb: FormBuilder) {
    this.operacionForm = this.fb.group({
      promedioKmMes:            [0, [Validators.required, Validators.min(0)]],
      tienePlanMantenimiento:   ['', Validators.required],
      frecuenciaMantenimiento:  [''],
      fechaUltimoMantenimiento: [''],
      tieneSiniestros:          ['', Validators.required],
      numeroSiniestros:         [0, Validators.min(0)],
      observaciones:            [''],
    });
  }

  get mostrarMantenimiento(): boolean {
    return this.operacionForm.get('tienePlanMantenimiento')?.value === 'SI';
  }

  get mostrarSiniestros(): boolean {
    return this.operacionForm.get('tieneSiniestros')?.value === 'SI';
  }

  cerrarModal() {
    this.operacionForm.reset({
      promedioKmMes: 0, tienePlanMantenimiento: '',
      frecuenciaMantenimiento: '', fechaUltimoMantenimiento: '',
      tieneSiniestros: '', numeroSiniestros: 0, observaciones: '',
    });
    this.mostrarModal.set(false);
  }

  abrirModal(vehiculo: any) {
    this.vehiculoId = vehiculo.id;
    this.placa = vehiculo.placa ?? '';
    this.operacionForm.patchValue({
      promedioKmMes:            vehiculo.promedioKmMes            ?? 0,
      tienePlanMantenimiento:   vehiculo.tienePlanMantenimiento   ?? '',
      frecuenciaMantenimiento:  vehiculo.frecuenciaMantenimiento  ?? '',
      fechaUltimoMantenimiento: vehiculo.fechaUltimoMantenimiento ?? '',
      tieneSiniestros:          vehiculo.tieneSiniestros          ?? '',
      numeroSiniestros:         vehiculo.numeroSiniestros         ?? 0,
      observaciones:            vehiculo.observaciones            ?? '',
    });
    this.mostrarModal.set(true);
  }

  async handleSave() {
    if (!this.operacionForm.valid) {
      this._alerta.showWarning('Por favor, completa los campos obligatorios.');
      return;
    }
    const nit = this._auth.getCurrentUser().displayName;
    const periodo = this._auth.periodo();
    const path = `Empresas/${nit}/periodos/${periodo}/006-diagnostico-vehiculos/${this.vehiculoId}`;
    try {
      await this._firestore.updateDocument(path, this.operacionForm.value);
      this._alerta.showSuccess('Información de operación guardada exitosamente.');
      this.cerrarModal();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error al guardar';
      console.error('[Form3Vehiculos] handleSave:', error);
      this._alerta.showError(msg);
    }
  }

  handleCancel() { this.cerrarModal(); }
}
