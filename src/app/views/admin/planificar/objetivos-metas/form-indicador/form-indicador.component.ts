import { CommonModule } from '@angular/common';
import { Component, signal, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { AlertaService } from '../../../../../services/shared/alerta.service';
import { FirestoreService } from '../../../../../services/shared/firestore.service';
import { ObjetivosMetasService } from '../../../../../services/shared/objetivos-metas.service';
import { ModelObjetivosMetas as M } from '../../../../../interfaces/objetivosMetas.interface';

@Component({
  selector: 'app-form-indicador',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './form-indicador.component.html',
  styleUrl: './form-indicador.component.css'
})
export class FormIndicadorComponent {

  private _firestore = inject(FirestoreService);
  private _objetivos = inject(ObjetivosMetasService);
  public _alerta = inject(AlertaService);

  mostrarModal = signal<boolean>(false);
  guardando = signal<boolean>(false);
  contexto = signal<string>('');

  maxDescripcion = M.MAX_DESCRIPCION;

  nombresTrimestres = M.TRIMESTRES;
  direcciones = M.DIRECCIONES;
  unidades = ['%', 'Siniestros', 'Días', 'Horas', 'Capacitaciones', 'Inspecciones', 'Unidades'];

  /** Los valores medidos se manejan aparte: pueden quedar en null. */
  trimestres: (number | null)[] = M.trimestresVacios();

  form: FormGroup;
  modo: 'crear' | 'editar' = 'crear';
  datosEdicion: M.ConsultarIndicador | null = null;
  private objetivoEspecificoId = '';

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      codigo: ['', [Validators.required, Validators.maxLength(20)]],
      nombre: ['', [Validators.required, Validators.maxLength(M.MAX_DESCRIPCION)]],
      unidad: ['%', [Validators.required]],
      direccion: ['mayorIgual' as M.Direccion, [Validators.required]],
      meta: [null, [Validators.required]],
    });
  }

  /** Símbolo de la dirección elegida, para mostrarlo junto a la meta. */
  get simbolo(): string {
    const clave = this.form.get('direccion')?.value as M.Direccion;
    return M.DIRECCIONES.find(d => d.clave === clave)?.simbolo ?? '≥';
  }

  /** Estado que tendría cada trimestre con los valores actuales del formulario. */
  estadoTrimestre(indice: number): M.EstadoIndicador {
    return this._objetivos.estadoIndicador(
      {
        ...this.form.value,
        meta: Number(this.form.value.meta),
        trimestres: this.trimestres,
        objetivoEspecificoId: this.objetivoEspecificoId,
      } as M.Indicador,
      indice as M.Trimestre
    );
  }

  claseEstado(indice: number): string {
    return this._objetivos.claseEstadoIndicador(this.estadoTrimestre(indice));
  }

  abrirModal(
    modo: 'crear' | 'editar',
    objetivoEspecificoId: string,
    contexto: string,
    dato?: M.ConsultarIndicador,
    siguienteCodigo = ''
  ) {
    this.modo = modo;
    this.objetivoEspecificoId = objetivoEspecificoId;
    this.contexto.set(contexto);
    this.form.reset({ unidad: '%', direccion: 'mayorIgual', meta: null });
    this.trimestres = M.trimestresVacios();

    if (modo === 'editar' && dato) {
      this.datosEdicion = dato;
      this.form.patchValue({
        codigo: dato.codigo,
        nombre: dato.nombre,
        unidad: dato.unidad,
        direccion: dato.direccion,
        meta: dato.meta,
      });
      this.trimestres = [...(dato.trimestres ?? M.trimestresVacios())];
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
    this.form.reset({ unidad: '%', direccion: 'mayorIgual', meta: null });
    this.trimestres = M.trimestresVacios();
    this.datosEdicion = null;
    this.mostrarModal.set(false);
  }

  async handleSave() {
    if (!this.form.valid) {
      this.form.markAllAsTouched();
      this._alerta.showWarning('Por favor, completa el formulario correctamente.');
      return;
    }

    const path = this._objetivos.ruta('-indicadores');
    const datos: M.Indicador = {
      ...this.form.value,
      meta: Number(this.form.value.meta),
      // Un campo vacío es "sin medir", no cero
      trimestres: this.trimestres.map(v => (v === null || v === undefined || (v as any) === '') ? null : Number(v)),
      objetivoEspecificoId: this.objetivoEspecificoId,
    };

    this.guardando.set(true);
    try {
      if (this.modo === 'editar' && this.datosEdicion) {
        await this._firestore.updateDocument(`${path}/${this.datosEdicion.id}`, datos);
        this._alerta.showSuccess('Indicador actualizado exitosamente.');
      } else {
        await this._firestore.createDocument(path, datos);
        this._alerta.showSuccess('Indicador creado exitosamente.');
      }
      this.cerrarModal();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error al guardar el indicador';
      console.error('[FormIndicador] handleSave:', error);
      this._alerta.showError(msg);
    } finally {
      this.guardando.set(false);
    }
  }

  handleCancel() {
    this.cerrarModal();
  }
}
