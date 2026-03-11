import { CommonModule } from '@angular/common';
import { Component, signal, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthenticacionService } from '../../../../../../services/shared/authenticacion.service';
import { FirestoreService } from '../../../../../../services/shared/firestore.service';
import { AlertaService } from '../../../../../../services/shared/alerta.service';

@Component({
  selector: 'app-form1-vehiculos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './form1-vehiculos.component.html',
  styleUrl: './form1-vehiculos.component.css'
})
export class Form1VehiculosComponent {

  private _auth = inject(AuthenticacionService);
  private _firestore = inject(FirestoreService);
  public _alerta = inject(AlertaService);

  mostrarModal = signal<boolean>(false);
  vehiculoForm: FormGroup;

  modo: 'crear' | 'editar' = 'crear';
  datosEdicion: any = null;

  constructor(private fb: FormBuilder) {
    this.vehiculoForm = this.fb.group({
      tipoVehiculo:      ['', Validators.required],
      placa:             ['', [Validators.required, Validators.maxLength(10)]],
      vin:               ['', Validators.maxLength(17)],
      numeroMotor:       ['', Validators.maxLength(30)],
      fechaFabricacion:  [''],
      kilometrajeActual: [0, Validators.min(0)],
      marca:             ['', Validators.maxLength(40)],
      modelo:            ['', Validators.maxLength(4)],
      tipoRelacion:      ['', Validators.required],
    });
  }

  cerrarModal() {
    this.vehiculoForm.reset({
      tipoVehiculo: '', placa: '', vin: '', numeroMotor: '',
      fechaFabricacion: '', kilometrajeActual: 0,
      marca: '', modelo: '', tipoRelacion: '',
    });
    this.mostrarModal.set(false);
  }

  abrirModal(modo: 'crear' | 'editar', datosEditar?: any) {
    this.modo = modo;
    this.datosEdicion = datosEditar ?? null;
    if (modo === 'editar' && datosEditar) {
      this.vehiculoForm.patchValue(datosEditar);
    }
    this.mostrarModal.set(true);
  }

  async handleSave() {
    if (!this.vehiculoForm.valid) {
      this._alerta.showWarning('Por favor, completa el formulario correctamente.');
      return;
    }
    const nit = this._auth.getCurrentUser().displayName;
    const periodo = this._auth.periodo();
    const path = `Empresas/${nit}/periodos/${periodo}/006-diagnostico-vehiculos`;
    try {
      if (this.modo === 'editar') {
        await this._firestore.updateDocument(`${path}/${this.datosEdicion.id}`, this.vehiculoForm.value);
        this._alerta.showSuccess('Vehículo actualizado exitosamente.');
      } else {
        const val = { ...this.vehiculoForm.value, periodo };
        val.placa = val.placa.toUpperCase().trim();
        if (val.vin) val.vin = val.vin.toUpperCase().trim();
        await this._firestore.createDocument(path, val);
        this._alerta.showSuccess('Vehículo registrado exitosamente.');
      }
      this.cerrarModal();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error al guardar el vehículo';
      console.error('[Form1Vehiculos] handleSave:', error);
      this._alerta.showError(msg);
    }
  }

  handleCancel() { this.cerrarModal(); }
}
