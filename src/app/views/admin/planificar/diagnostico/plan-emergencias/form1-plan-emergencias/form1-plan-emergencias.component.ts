import { CommonModule } from '@angular/common';
import { Component, signal, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthenticacionService } from '../../../../../../services/shared/authenticacion.service';
import { FirestoreService } from '../../../../../../services/shared/firestore.service';
import { AlertaService } from '../../../../../../services/shared/alerta.service';
import { DiagnosticoDatosService } from '../../../../../../services/shared/diagnostico-datos.service';
import { TIPOS_EMERGENCIA, TIPO_EMERGENCIA_OTRO } from '../../../../../../data/emergencias';

@Component({
  selector: 'app-form1-plan-emergencias',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './form1-plan-emergencias.component.html',
  styleUrl: './form1-plan-emergencias.component.css'
})
export class Form1PlanEmergenciasComponent {

  private _auth = inject(AuthenticacionService);
  private _firestore = inject(FirestoreService);
  public _alerta = inject(AlertaService);

  mostrarModal = signal<boolean>(false);
  planForm: FormGroup;

  private _datos = inject(DiagnosticoDatosService);

  /** Vienen del archivo compartido para que la cobertura del tablero y
   *  las opciones del formulario no puedan discrepar. */
  readonly tipos = TIPOS_EMERGENCIA;
  readonly tipoOtro = TIPO_EMERGENCIA_OTRO;

  modo: 'crear' | 'editar' = 'crear';
  datosEdicion: any = null;

  constructor(private fb: FormBuilder) {
    this.planForm = this.fb.group({
      nombrePlan:         ['', [Validators.required, Validators.maxLength(120)]],
      tipoEmergencia:     ['', Validators.required],
      descripcion:        ['', Validators.required],
      protocoloAccion:    [''],
      responsable:        [''],
      telefonoEmergencia: [''],
      fechaElaboracion:   [''],
      fechaRevision:      [''],
    });
  }

  cerrarModal() {
    this.planForm.reset({
      nombrePlan: '', tipoEmergencia: '', descripcion: '',
      protocoloAccion: '', responsable: '', telefonoEmergencia: '',
      fechaElaboracion: '', fechaRevision: '',
    });
    this.mostrarModal.set(false);
  }

  abrirModal(modo: 'crear' | 'editar', datosEditar?: any) {
    this.modo = modo;
    this.datosEdicion = datosEditar ?? null;
    if (modo === 'editar' && datosEditar) this.planForm.patchValue(datosEditar);
    this.mostrarModal.set(true);
  }

  async handleSave() {
    if (!this.planForm.valid) {
      this._alerta.showWarning('Por favor, completa el formulario correctamente.');
      return;
    }
    const periodo = this._auth.periodo();
    const path = this._datos.ruta('plan-emergencias');
    try {
      if (this.modo === 'editar') {
        await this._firestore.updateDocument(`${path}/${this.datosEdicion.id}`, this.planForm.value);
        this._alerta.showSuccess('Plan actualizado exitosamente.');
      } else {
        await this._firestore.createDocument(path, { ...this.planForm.value, periodo });
        this._alerta.showSuccess('Plan registrado exitosamente.');
      }
      this.cerrarModal();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error al guardar el plan';
      console.error('[Form1PlanEmergencias] handleSave:', error);
      this._alerta.showError(msg);
    }
  }

  handleCancel() { this.cerrarModal(); }
}
