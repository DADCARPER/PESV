import { CommonModule } from '@angular/common';
import { Component, signal, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AlertaService } from '../../../../../services/shared/alerta.service';
import { FirestoreService } from '../../../../../services/shared/firestore.service';
import { ObjetivosMetasService } from '../../../../../services/shared/objetivos-metas.service';
import { ModelObjetivosMetas as M } from '../../../../../interfaces/objetivosMetas.interface';

@Component({
  selector: 'app-form-especifico',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './form-especifico.component.html',
  styleUrl: './form-especifico.component.css'
})
export class FormEspecificoComponent {

  private _firestore = inject(FirestoreService);
  private _objetivos = inject(ObjetivosMetasService);
  public _alerta = inject(AlertaService);

  maxDescripcion = M.MAX_DESCRIPCION;

  mostrarModal = signal<boolean>(false);
  guardando = signal<boolean>(false);
  /** Código del objetivo general al que pertenece, solo para mostrarlo. */
  contexto = signal<string>('');

  form: FormGroup;
  modo: 'crear' | 'editar' = 'crear';
  datosEdicion: M.ConsultarObjetivoEspecifico | null = null;
  private objetivoGeneralId = '';

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      codigo: ['', [Validators.required, Validators.maxLength(20)]],
      descripcion: ['', [Validators.required, Validators.maxLength(M.MAX_DESCRIPCION)]],
      meta: [100, [Validators.required, Validators.min(1), Validators.max(100)]],
    });
  }

  abrirModal(
    modo: 'crear' | 'editar',
    objetivoGeneralId: string,
    contexto: string,
    dato?: M.ConsultarObjetivoEspecifico,
    siguienteCodigo = ''
  ) {
    this.modo = modo;
    this.objetivoGeneralId = objetivoGeneralId;
    this.contexto.set(contexto);
    this.form.reset({ meta: 100 });

    if (modo === 'editar' && dato) {
      this.datosEdicion = dato;
      this.form.patchValue({
        codigo: dato.codigo,
        descripcion: dato.descripcion,
        meta: dato.meta,
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
    this.form.reset({ meta: 100 });
    this.datosEdicion = null;
    this.mostrarModal.set(false);
  }

  async handleSave() {
    if (!this.form.valid) {
      this.form.markAllAsTouched();
      this._alerta.showWarning('Por favor, completa el formulario correctamente.');
      return;
    }

    const path = this._objetivos.ruta('-especificos');
    const datos: M.ObjetivoEspecifico = {
      ...this.form.value,
      meta: Number(this.form.value.meta),
      objetivoGeneralId: this.objetivoGeneralId,
    };

    this.guardando.set(true);
    try {
      if (this.modo === 'editar' && this.datosEdicion) {
        await this._firestore.updateDocument(`${path}/${this.datosEdicion.id}`, datos);
        this._alerta.showSuccess('Objetivo específico actualizado exitosamente.');
      } else {
        await this._firestore.createDocument(path, datos);
        this._alerta.showSuccess('Objetivo específico creado exitosamente.');
      }
      this.cerrarModal();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error al guardar el objetivo específico';
      console.error('[FormEspecifico] handleSave:', error);
      this._alerta.showError(msg);
    } finally {
      this.guardando.set(false);
    }
  }

  handleCancel() {
    this.cerrarModal();
  }
}
