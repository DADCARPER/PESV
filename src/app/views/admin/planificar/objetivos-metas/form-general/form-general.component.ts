import { CommonModule } from '@angular/common';
import { Component, signal, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AlertaService } from '../../../../../services/shared/alerta.service';
import { FirestoreService } from '../../../../../services/shared/firestore.service';
import { ObjetivosMetasService } from '../../../../../services/shared/objetivos-metas.service';
import { ModelObjetivosMetas as M } from '../../../../../interfaces/objetivosMetas.interface';

@Component({
  selector: 'app-form-general',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './form-general.component.html',
  styleUrl: './form-general.component.css'
})
export class FormGeneralComponent {

  private _firestore = inject(FirestoreService);
  private _objetivos = inject(ObjetivosMetasService);
  public _alerta = inject(AlertaService);

  maxDescripcion = M.MAX_DESCRIPCION;

  mostrarModal = signal<boolean>(false);
  guardando = signal<boolean>(false);

  form: FormGroup;
  modo: 'crear' | 'editar' = 'crear';
  datosEdicion: M.ConsultarObjetivoGeneral | null = null;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      codigo: ['', [Validators.required, Validators.maxLength(20)]],
      descripcion: ['', [Validators.required, Validators.maxLength(M.MAX_DESCRIPCION)]],
      responsable: ['', [Validators.required, Validators.maxLength(80)]],
    });
  }

  abrirModal(modo: 'crear' | 'editar', dato?: M.ConsultarObjetivoGeneral, siguienteCodigo = '') {
    this.modo = modo;
    this.form.reset();

    if (modo === 'editar' && dato) {
      this.datosEdicion = dato;
      this.form.patchValue({
        codigo: dato.codigo,
        descripcion: dato.descripcion,
        responsable: dato.responsable,
      });
    } else {
      this.datosEdicion = null;
      this.form.patchValue({ codigo: siguienteCodigo });
    }

    this.mostrarModal.set(true);
  }


  /** Un campo se marca en rojo cuando ya se tocó o se intentó guardar. */
  invalido(campo: string): boolean {
    const c = this.form.get(campo);
    return !!c && c.invalid && (c.touched || c.dirty);
  }

  /** Clases del borde según el estado de validación. */
  borde(campo: string): string {
    return this.invalido(campo) ? 'border-red-500' : 'border-gray-300';
  }

  /** Mensaje concreto del primer error del campo. */
  error(campo: string): string {
    const c = this.form.get(campo);
    if (!c || !c.errors || !(c.touched || c.dirty)) return '';
    if (c.errors['required']) return 'Este campo es obligatorio.';
    if (c.errors['maxlength']) {
      const e = c.errors['maxlength'];
      return `Máximo ${e.requiredLength} caracteres (llevas ${e.actualLength}).`;
    }
    if (c.errors['min']) return `El valor mínimo es ${c.errors['min'].min}.`;
    if (c.errors['max']) return `El valor máximo es ${c.errors['max'].max}.`;
    return 'Revisa este campo.';
  }

  /** Caracteres usados en un campo de texto largo. */
  usados(campo: string): number {
    return (this.form.get(campo)?.value || '').length;
  }

  cerrarModal() {
    this.form.reset();
    this.datosEdicion = null;
    this.mostrarModal.set(false);
  }

  async handleSave() {
    if (!this.form.valid) {
      this.form.markAllAsTouched();
      this._alerta.showWarning('Por favor, completa el formulario correctamente.');
      return;
    }

    const path = this._objetivos.ruta();
    this.guardando.set(true);
    try {
      if (this.modo === 'editar' && this.datosEdicion) {
        await this._firestore.updateDocument(`${path}/${this.datosEdicion.id}`, this.form.value);
        this._alerta.showSuccess('Objetivo general actualizado exitosamente.');
      } else {
        await this._firestore.createDocument(path, this.form.value as M.ObjetivoGeneral);
        this._alerta.showSuccess('Objetivo general creado exitosamente.');
      }
      this.cerrarModal();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error al guardar el objetivo general';
      console.error('[FormGeneral] handleSave:', error);
      this._alerta.showError(msg);
    } finally {
      this.guardando.set(false);
    }
  }

  handleCancel() {
    this.cerrarModal();
  }
}
