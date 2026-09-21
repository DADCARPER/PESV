import { CommonModule } from '@angular/common';
import { Component, signal, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthenticacionService } from '../../../../../../services/shared/authenticacion.service';
import { DiagnosticoDatosService } from '../../../../../../services/shared/diagnostico-datos.service';
import { Models } from '../../../../../../interfaces/models';
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

  private _datos = inject(DiagnosticoDatosService);

  /**
   * Contratistas ya registrados, para decir de quien es un vehiculo que no es
   * propio. Antes el contratista guardaba cuantos vehiculos tenia, un numero
   * que podia discrepar de la flota y que no tenia placa ni SOAT.
   */
  contratistas = signal<Models.Diagnostico.Contratistas[]>([]);

  /** Un vehiculo que no es propio viene de algun contratista. */
  get pideContratista(): boolean {
    const relacion = this.vehiculoForm.get('tipoRelacion')?.value;
    return !!relacion && relacion !== 'Propio';
  }

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
      contratistaId:     [''],
    });
  }

  cerrarModal() {
    this.vehiculoForm.reset({
      tipoVehiculo: '', placa: '', vin: '', numeroMotor: '',
      fechaFabricacion: '', kilometrajeActual: 0,
      marca: '', modelo: '', tipoRelacion: '', contratistaId: '',
    });
    this.mostrarModal.set(false);
  }

  async abrirModal(modo: 'crear' | 'editar', datosEditar?: any) {
    this.modo = modo;
    this.datosEdicion = datosEditar ?? null;
    this.cargarContratistas();
    if (modo === 'editar' && datosEditar) {
      this.vehiculoForm.patchValue(datosEditar);
    }
    this.mostrarModal.set(true);
  }

  /** Se piden al abrir: la lista cambia mientras se usa la aplicacion. */
  private async cargarContratistas() {
    try {
      this.contratistas.set(
        await this._datos.todos<Models.Diagnostico.Contratistas>('contratistas')
      );
    } catch (error: unknown) {
      console.error('[Form1Vehiculos] cargarContratistas:', error);
      this.contratistas.set([]);
    }
  }

  async handleSave() {
    if (!this.vehiculoForm.valid) {
      this._alerta.showWarning('Por favor, completa el formulario correctamente.');
      return;
    }
    const periodo = this._auth.periodo();
    const path = this._datos.ruta('vehiculos');
    try {
      const val = { ...this.vehiculoForm.value };

      // Se guarda tambien el nombre del contratista, no solo su id: asi la
      // ficha del vehiculo sigue entendiendose si el contratista se da de baja.
      val.contratistaNombre = this.pideContratista
        ? (this.contratistas().find(c => c.id === val.contratistaId)?.nombreRazonSocial ?? '')
        : '';
      if (!this.pideContratista) val.contratistaId = '';

      if (this.modo === 'editar') {
        await this._firestore.updateDocument(`${path}/${this.datosEdicion.id}`, val);
        this._alerta.showSuccess('Vehículo actualizado exitosamente.');
      } else {
        val.periodo = periodo;
        val.placa = String(val.placa).toUpperCase().trim();
        if (val.vin) val.vin = String(val.vin).toUpperCase().trim();
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
