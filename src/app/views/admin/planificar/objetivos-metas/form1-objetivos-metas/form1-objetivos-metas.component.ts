import { CommonModule } from '@angular/common';
import { Component, signal, inject, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { AlertaService } from '../../../../../services/shared/alerta.service';
import { FirestoreService } from '../../../../../services/shared/firestore.service';
import { AuthenticacionService } from '../../../../../services/shared/authenticacion.service';
import { Models } from '../../../../../interfaces/models';

@Component({
  selector: 'app-form1-objetivos-metas',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './form1-objetivos-metas.component.html',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  styleUrl: './form1-objetivos-metas.component.css'
})
export class Form1ObjetivosMetasComponent {

  private _authcations = inject(AuthenticacionService);
  private _firestore = inject(FirestoreService);
  public _alerta = inject(AlertaService);

  // Signal para controlar la visibilidad del modal
  mostrarModal = signal<boolean>(false);
  guardando = signal<boolean>(false);

  objetivoForm: FormGroup;

  modo: 'crear' | 'editar' = 'crear';
  datosEdicion: Models.ObjetivosMetas.ConsultarObjetivo | null = null;

  frecuencias = ['Mensual', 'Trimestral', 'Semestral', 'Anual'];
  unidades = ['%', 'Siniestros', 'Días', 'Horas', 'Capacitaciones', 'Inspecciones', 'Unidades'];

  constructor(private fb: FormBuilder) {
    this.objetivoForm = this.fb.group({
      codigo: ['', [Validators.required, Validators.maxLength(20)]],
      descripcion: ['', [Validators.required, Validators.maxLength(500)]],
      responsable: ['', [Validators.required, Validators.maxLength(80)]],
      cargoResponsable: ['', [Validators.maxLength(80)]],
      fechaInicio: ['', [Validators.required]],
      fechaFin: ['', [Validators.required]],
      metas: this.fb.array([])
    });
  }

  get metas(): FormArray {
    return this.objetivoForm.get('metas') as FormArray;
  }

  private crearGrupoMeta(meta?: Models.ObjetivosMetas.Meta): FormGroup {
    return this.fb.group({
      descripcion: [meta?.descripcion ?? '', [Validators.required, Validators.maxLength(300)]],
      indicador: [meta?.indicador ?? '', [Validators.required, Validators.maxLength(200)]],
      unidad: [meta?.unidad ?? '', [Validators.required]],
      lineaBase: [meta?.lineaBase ?? null],
      valorMeta: [meta?.valorMeta ?? null, [Validators.required]],
      frecuencia: [meta?.frecuencia ?? '', [Validators.required]]
    });
  }

  agregarMeta() {
    this.metas.push(this.crearGrupoMeta());
  }

  eliminarMeta(indice: number) {
    this.metas.removeAt(indice);
  }

  // Método para abrir el modal
  abrirModal(modo: 'crear' | 'editar', datosEditar?: Models.ObjetivosMetas.ConsultarObjetivo, siguienteCodigo = '') {
    this.modo = modo;
    this.objetivoForm.reset();
    this.metas.clear();

    if (modo === 'editar' && datosEditar) {
      this.datosEdicion = datosEditar;
      this.cargarDatos();
    } else {
      this.datosEdicion = null;
      this.objetivoForm.patchValue({ codigo: siguienteCodigo });
      this.agregarMeta(); // un objetivo nace con al menos una meta
    }

    this.mostrarModal.set(true);
  }

  // Método para cerrar el modal
  cerrarModal() {
    this.objetivoForm.reset();
    this.metas.clear();
    this.datosEdicion = null;
    this.mostrarModal.set(false);
  }

  // Método para cargar datos cuando es edición
  cargarDatos() {
    if (!this.datosEdicion) return;

    this.objetivoForm.patchValue({
      codigo: this.datosEdicion.codigo,
      descripcion: this.datosEdicion.descripcion,
      responsable: this.datosEdicion.responsable,
      cargoResponsable: this.datosEdicion.cargoResponsable,
      fechaInicio: this.datosEdicion.fechaInicio,
      fechaFin: this.datosEdicion.fechaFin
    });

    (this.datosEdicion.metas ?? []).forEach(meta => this.metas.push(this.crearGrupoMeta(meta)));

    if (this.metas.length === 0) {
      this.agregarMeta();
    }
  }

  // Método para manejar el clic en "Guardar"
  async handleSave() {
    if (!this.objetivoForm.valid) {
      this.objetivoForm.markAllAsTouched();
      this._alerta.showWarning('Por favor, completa el formulario correctamente.');
      return;
    }

    if (this.metas.length === 0) {
      this._alerta.showWarning('El objetivo debe tener al menos una meta.');
      return;
    }

    const nit = this._authcations.getCurrentUser().displayName;
    const periodo = this._authcations.periodo();
    const path = `Empresas/${nit}/periodos/${periodo}/007-objetivos-metas`;
    const datos = this.objetivoForm.value as Models.ObjetivosMetas.NuevoObjetivo;

    this.guardando.set(true);
    try {
      if (this.modo === 'editar' && this.datosEdicion) {
        await this._firestore.updateDocument(`${path}/${this.datosEdicion.id}`, datos);
        this._alerta.showSuccess('Objetivo actualizado exitosamente.');
      } else {
        await this._firestore.createDocument(path, datos);
        this._alerta.showSuccess('Objetivo creado exitosamente.');
      }
      this.cerrarModal();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error al guardar el objetivo';
      console.error('[Form1ObjetivosMetas] handleSave:', error);
      this._alerta.showError(msg);
    } finally {
      this.guardando.set(false);
    }
  }

  // Método para manejar el clic en "Cancelar"
  handleCancel() {
    this.cerrarModal();
  }

}
