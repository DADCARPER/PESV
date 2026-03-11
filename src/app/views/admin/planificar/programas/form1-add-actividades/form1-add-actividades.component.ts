import { CommonModule } from '@angular/common';
import { Component, signal, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AlertaInformativoComponent } from "../../../../../components/alertas/alerta-informativo/alerta-informativo.component";
import { AlertaService } from '../../../../../services/shared/alerta.service';
import { FirestoreService } from '../../../../../services/shared/firestore.service';
import { AuthenticacionService } from '../../../../../services/shared/authenticacion.service';
import { ProgramasService } from '../programas.service';

@Component({
  selector: 'app-form1-add-actividades',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AlertaInformativoComponent],
  templateUrl: './form1-add-actividades.component.html',
  styleUrl: './form1-add-actividades.component.css'
})
export class Form1AddActividadesComponent {

  private _authcations = inject(AuthenticacionService);
  private _firestore = inject(FirestoreService);
  public _alerta = inject(AlertaService);
  private _programas = inject(ProgramasService);

  // Signal para controlar la visibilidad del modal (igual que app-form1-sedes)
  mostrarModal = signal<boolean>(false);

  // Formulario reactivo
  agregarActividadForm: FormGroup;

  // Modo del formulario y datos cuando es edición
  modo: 'crear' | 'editar';
  datosEdicion: any = null;

  // Obtiene el programId
  programIdForCreate: string = '';

  constructor(private fb: FormBuilder) {
    this.agregarActividadForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(120)]],
      responsable: [null, [Validators.required, Validators.maxLength(80)]],
      objetivodescripcion: ['', [Validators.required, Validators.maxLength(500)]],
      startDate: ['', [Validators.required]],
      endDate: ['', [Validators.required]],
      descripcionindicator: ['', [Validators.required, Validators.maxLength(300)]],
      meta: ['', [Validators.min(0), Validators.required]],
      status: ['En ejecución'],
      comportamiento: ['Ascendente', [Validators.required]],
      ingreso: ['Acumulado'],
      valorInicial: ['0', [Validators.required, Validators.min(0)]],
      valorReal: ['0', [Validators.min(0)]],
      avance: ['0'],
      pesoActividad: ['0', [Validators.min(0), Validators.max(100), Validators.required]],
    });
  }

  // Abrir modal. Permite pasar datos cuando es edición o contexto cuando es creación
  abrirModal(modo: any, datos: any) {
    this.mostrarModal.set(true);
    this.modo = modo;
    console.log('programIdForCreate', this.programIdForCreate);
    if (modo === 'editar' && datos) {
      this.datosEdicion = datos;
      this.programIdForCreate = datos.programId;
      console.log('Entro en editar', this.programIdForCreate);
      this.cargarDatos();
    } else if (modo === 'crear' && datos) {
      // modo crear
      this.datosEdicion = null;
      this.programIdForCreate = datos;
      console.log('Entro en crear', this.programIdForCreate);
      this.resetForm();
    }
  }

  // Cerrar modal
  cerrarModal() {
    this.resetForm();
    this.mostrarModal.set(false);
  }

  // Guardar cambios (crear o editar)
  async handleSave() {
    if (!this.agregarActividadForm.valid) {
      this._alerta.showWarning('Por favor, completa el formulario correctamente.');
      this.markFormGroupTouched();
      return;
    }

    const uid = this._authcations.getCurrentUser().uid;
    const nit = this._authcations.getCurrentUser().displayName;
    const path = `Empresas/${nit}/008-actividades-gestion-riesgos`;
    const raw = this.agregarActividadForm.value;
    // Normaliza meta y valorReal a 0 si vienen vacíos
    const payload = {
      ...raw,
      meta: (raw.meta === '' || raw.meta === null || raw.meta === undefined) ? 0 : Number(raw.meta),
      valorReal: (raw.comportamiento === 'Ascendente') ? (raw.valorReal === '' || raw.valorReal === null || raw.valorReal === undefined) ? 0 : Number(raw.valorReal) : (raw.valorReal === '' || raw.valorReal === null || raw.valorReal === undefined) ? 0 : Number(raw.meta),
    };
    
    if(payload.comportamiento === 'Ascendente' && payload.valorReal > payload.meta){
      this._alerta.showWarning('El valor real no puede ser mayor a la meta.');
      return;
    }
    if(payload.comportamiento === 'Descendente' && payload.valorReal < payload.meta){
      this._alerta.showWarning('El valor real no puede ser menor a la meta.');
      return;
    }

    payload.avance = this._programas.calcularAvance(payload.valorInicial, payload.meta, payload.valorReal, payload.comportamiento, payload.ingreso);

    try {
      if (this.modo === 'editar' && this.datosEdicion?.id) {
        await this._firestore.updateDocument(`${path}/${this.datosEdicion.id}`, payload);
        this._alerta.showSuccess('Actividad actualizada exitosamente.');
      } else {
        // crear: adjunta metadatos mínimos
        const nuevo = {
          ...payload,
          programId: this.programIdForCreate
        };
        await this._firestore.createDocument(path, nuevo);
        this._alerta.showSuccess('Actividad creada exitosamente.');
      }
      this.cerrarModal();
    } catch (error) {
      this._alerta.showError('Tu Conexión Internet Falló');
    }
  }

  // Cancelar
  handleCancel() {
    this.cerrarModal();
  }

  // Cargar datos al formulario cuando es edición
  private cargarDatos() {
    if (!this.datosEdicion) return;
    this.agregarActividadForm.patchValue({
      name: this.datosEdicion.name ?? this.datosEdicion.nombreActividad ?? '',
      responsable: this.datosEdicion.responsable ?? this.datosEdicion.responsible ?? null,
      objetivodescripcion: this.datosEdicion.objetivodescripcion ?? this.datosEdicion.objetivoActividad ?? '',
      startDate: this.datosEdicion.startDate ?? this.datosEdicion.fechaInicio ?? '',
      endDate: this.datosEdicion.endDate ?? this.datosEdicion.fechaFin ?? '',
      descripcionindicator: this.datosEdicion.descripcionindicator ?? this.datosEdicion.descripcionIndicador ?? '',
      comportamiento: this.datosEdicion.comportamiento ?? 'Ascendente',
      ingreso: this.datosEdicion.ingreso ?? 'Acumulado',
      valorInicial: this.datosEdicion.valorInicial ?? '0',
      meta: this.datosEdicion.meta ?? '',
      valorReal: this.datosEdicion.valorReal ?? '',
      pesoActividad: this.datosEdicion.pesoActividad ?? '0'
    });
  }

  // Resetear formulario a estado inicial
  private resetForm() {
    this.agregarActividadForm.reset();
    this.agregarActividadForm.patchValue({ pesoActividad: '0' });
    this.agregarActividadForm.patchValue({ ingreso: 'Acumulado' });
    this.agregarActividadForm.patchValue({ comportamiento: 'Ascendente' });
    this.agregarActividadForm.patchValue({ status: 'En ejecución' });
    this.agregarActividadForm.patchValue({ valorInicial: '0' });
    this.agregarActividadForm.patchValue({ meta: '0' });
  }

  // Helpers de validación
  private markFormGroupTouched(): void {
    Object.keys(this.agregarActividadForm.controls).forEach(key => {
      const control = this.agregarActividadForm.get(key);
      control?.markAsTouched();
    });
  }

  hasError(fieldName: string): boolean {
    const field = this.agregarActividadForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getErrorMessage(fieldName: string): string {
    const field = this.agregarActividadForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return 'Este campo es requerido';
      if (field.errors['min']) return 'El valor debe ser mayor a 0';
      if (field.errors['maxlength']) return 'Longitud máxima superada';
    }
    return '';
  }

  
}