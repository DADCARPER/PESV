import { CommonModule } from '@angular/common';
import { Component, signal, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthenticacionService } from '../../../../../../services/shared/authenticacion.service';
import { FirestoreService } from '../../../../../../services/shared/firestore.service';
import { AlertaService } from '../../../../../../services/shared/alerta.service';

@Component({
  selector: 'app-form1-rutas',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './form1-rutas.component.html',
  styleUrl: './form1-rutas.component.css'
})
export class Form1RutasComponent {

  private _auth = inject(AuthenticacionService);
  private _firestore = inject(FirestoreService);
  public _alerta = inject(AlertaService);

  mostrarModal = signal<boolean>(false);
  rutaForm: FormGroup;

  modo: 'crear' | 'editar' = 'crear';
  datosEdicion: any = null;

  constructor(private fb: FormBuilder) {
    this.rutaForm = this.fb.group({
      nombreRuta:       ['', [Validators.required, Validators.maxLength(100)]],
      origen:           ['', Validators.required],
      destino:          ['', Validators.required],
      distanciaKm:      [0, Validators.min(0)],
      tiempoEstimado:    [''],
      tipoVia:          ['', Validators.required],
      frecuencia:       ['', Validators.required],
      observaciones:    [''],
    });
  }

  cerrarModal() {
    this.rutaForm.reset({
      nombreRuta: '', origen: '', destino: '',
      distanciaKm: 0, tiempoEstimado: '',
      tipoVia: '', frecuencia: '', observaciones: '',
    });
    this.mostrarModal.set(false);
  }

  abrirModal(modo: 'crear' | 'editar', datosEditar?: any) {
    this.modo = modo;
    this.datosEdicion = datosEditar ?? null;
    if (modo === 'editar' && datosEditar) this.rutaForm.patchValue(datosEditar);
    this.mostrarModal.set(true);
  }

  async handleSave() {
    if (!this.rutaForm.valid) {
      this._alerta.showWarning('Por favor, completa el formulario correctamente.');
      return;
    }
    const nit = this._auth.getCurrentUser().displayName;
    const periodo = this._auth.periodo();
    const path = `Empresas/${nit}/periodos/${periodo}/006-diagnostico-rutas`;
    try {
      if (this.modo === 'editar') {
        await this._firestore.updateDocument(`${path}/${this.datosEdicion.id}`, this.rutaForm.value);
        this._alerta.showSuccess('Ruta actualizada exitosamente.');
      } else {
        await this._firestore.createDocument(path, { ...this.rutaForm.value, periodo });
        this._alerta.showSuccess('Ruta registrada exitosamente.');
      }
      this.cerrarModal();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error al guardar la ruta';
      console.error('[Form1Rutas] handleSave:', error);
      this._alerta.showError(msg);
    }
  }

  handleCancel() { this.cerrarModal(); }
}
