import { CommonModule } from '@angular/common';
import { Component, signal, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthenticacionService } from '../../../../../../services/shared/authenticacion.service';
import { FirestoreService } from '../../../../../../services/shared/firestore.service';
import { AlertaService } from '../../../../../../services/shared/alerta.service';
import { AlertaInformativoComponent } from "../../../../../../components/alertas/alerta-informativo/alerta-informativo.component";

@Component({
  selector: 'app-form1-contratistas',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AlertaInformativoComponent],
  templateUrl: './form1-contratistas.component.html',
  styleUrl: './form1-contratistas.component.css'
})
export class Form1ContratistasComponent {

  private _authcations = inject(AuthenticacionService);
  private _firestore = inject(FirestoreService);
  public _alerta = inject(AlertaService);

  mostrarModal = signal<boolean>(false);
  contratistaForm: FormGroup;

  modo: 'crear' | 'editar' = 'crear';
  datosEdicion: any = null;

  constructor(private fb: FormBuilder) {
    this.contratistaForm = this.fb.group({
      // Sección 1 – Identificación
      tipoContratista:  ['', Validators.required],
      tipoPersona:      ['', Validators.required],
      nombreRazonSocial: ['', [Validators.required, Validators.maxLength(120)]],
      nitCedula:        ['', [Validators.required, Validators.maxLength(30)]],
      // Sección 2 – Vinculación
      tipoVinculacion:     ['', Validators.required],
      vinculacionOtro:     [''],
      servicioPrestado:    ['', Validators.required],
      fechaInicioContrato: ['', Validators.required],
      contratoIndefinido:  [false],
      fechaFinContrato:    [''],
      // Sección 3 – Desplazamientos
      realizaDesplazamientos: ['', Validators.required],
      // Sección 4 – Flota
      tipoFlota:    [''],
      conductores:  [0, Validators.min(0)],
      observaciones: [''],
    });
  }

  get mostrarFlota(): boolean {
    return this.contratistaForm.get('realizaDesplazamientos')?.value === 'SI';
  }

  get mostrarOtroVinculacion(): boolean {
    return this.contratistaForm.get('tipoVinculacion')?.value === 'Otro';
  }

  get contratoEsIndefinido(): boolean {
    return this.contratistaForm.get('contratoIndefinido')?.value === true;
  }

  cerrarModal() {
    this.contratistaForm.reset({
      tipoContratista: '', tipoPersona: '', nombreRazonSocial: '', nitCedula: '',
      tipoVinculacion: '', vinculacionOtro: '', servicioPrestado: '',
      fechaInicioContrato: '', contratoIndefinido: false, fechaFinContrato: '',
      realizaDesplazamientos: '', tipoFlota: '',
      conductores: 0, observaciones: '',
    });
    this.mostrarModal.set(false);
  }

  abrirModal(modo: 'crear' | 'editar', datosEditar?: any) {
    this.modo = modo;
    this.datosEdicion = datosEditar ?? null;
    if (modo === 'editar' && datosEditar) {
      this.contratistaForm.patchValue(datosEditar);
    }
    this.mostrarModal.set(true);
  }

  async handleSave() {
    if (!this.contratistaForm.valid) {
      this._alerta.showWarning('Por favor, completa el formulario correctamente.');
      return;
    }
    const nit = this._authcations.getCurrentUser().displayName;
    const periodo = this._authcations.periodo();
    const path = `Empresas/${nit}/periodos/${periodo}/006-diagnostico-contratistas`;
    try {
      if (this.modo === 'editar') {
        await this._firestore.updateDocument(`${path}/${this.datosEdicion.id}`, this.contratistaForm.value);
        this._alerta.showSuccess('Contratista actualizado exitosamente.');
      } else {
        await this._firestore.createDocument(path, { ...this.contratistaForm.value, periodo });
        this._alerta.showSuccess('Contratista creado exitosamente.');
      }
      this.cerrarModal();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error al guardar el contratista';
      console.error('[Form1Contratistas] handleSave:', error);
      this._alerta.showError(msg);
    }
  }

  handleCancel() {
    this.cerrarModal();
  }
}
