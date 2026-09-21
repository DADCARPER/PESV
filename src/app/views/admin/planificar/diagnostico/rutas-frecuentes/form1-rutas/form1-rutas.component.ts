import { CommonModule } from '@angular/common';
import { Component, signal, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { AuthenticacionService } from '../../../../../../services/shared/authenticacion.service';
import { FirestoreService } from '../../../../../../services/shared/firestore.service';
import { AlertaService } from '../../../../../../services/shared/alerta.service';
import { DiagnosticoDatosService } from '../../../../../../services/shared/diagnostico-datos.service';
import { FACTORES_RIESGO_RUTA, kilometrosAlMes } from '../../../../../../data/rutas';

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

  private _datos = inject(DiagnosticoDatosService);

  readonly gruposRiesgo = FACTORES_RIESGO_RUTA;

  /**
   * Kilometros al mes que supondria la ruta tal como esta rellena.
   *
   * Se muestra mientras se escribe para que se vea el efecto de la
   * distancia y la frecuencia antes de guardar.
   */
  get kmAlMes(): number | null {
    return kilometrosAlMes(
      this.rutaForm.get('distanciaKm')?.value,
      this.rutaForm.get('frecuencia')?.value
    );
  }

  get factores(): FormArray {
    return this.rutaForm.get('factoresRiesgo') as FormArray;
  }

  marcado(factor: string): boolean {
    return this.factores.value.includes(factor);
  }

  alMarcar(factor: string, evento: Event) {
    if ((evento.target as HTMLInputElement).checked) {
      this.factores.push(this.fb.control(factor));
      return;
    }
    const i = this.factores.value.indexOf(factor);
    if (i >= 0) this.factores.removeAt(i);
  }

  constructor(private fb: FormBuilder) {
    this.rutaForm = this.fb.group({
      nombreRuta:       ['', [Validators.required, Validators.maxLength(100)]],
      origen:           ['', Validators.required],
      destino:          ['', Validators.required],
      distanciaKm:      [0, Validators.min(0)],
      tiempoEstimado:    [''],
      tipoVia:          ['', Validators.required],
      frecuencia:       ['', Validators.required],
      factoresRiesgo:   this.fb.array([]),
      observaciones:    [''],
    });
  }

  cerrarModal() {
    this.rutaForm.reset({
      nombreRuta: '', origen: '', destino: '',
      distanciaKm: 0, tiempoEstimado: '',
      tipoVia: '', frecuencia: '', observaciones: '',
    });
    this.factores.clear();
    this.mostrarModal.set(false);
  }

  abrirModal(modo: 'crear' | 'editar', datosEditar?: any) {
    this.modo = modo;
    this.datosEdicion = datosEditar ?? null;
    this.factores.clear();
    if (modo === 'editar' && datosEditar) {
      this.rutaForm.patchValue(datosEditar);
      // patchValue no llena un FormArray: hay que recrear sus controles.
      for (const factor of datosEditar.factoresRiesgo ?? []) {
        this.factores.push(this.fb.control(factor));
      }
    }
    this.mostrarModal.set(true);
  }

  async handleSave() {
    if (!this.rutaForm.valid) {
      this._alerta.showWarning('Por favor, completa el formulario correctamente.');
      return;
    }
    const periodo = this._auth.periodo();
    const path = this._datos.ruta('rutas');
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
