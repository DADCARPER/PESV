import { Component, inject, signal } from '@angular/core';
import { AlertaInformativoComponent } from "../../../../../components/alertas/alerta-informativo/alerta-informativo.component";
import { AuthenticacionService } from '../../../../../services/shared/authenticacion.service';
import { FirestoreService } from '../../../../../services/shared/firestore.service';
import { AlertaService } from '../../../../../services/shared/alerta.service';
import { ProgramasService } from '../../../planificar/programas/programas.service';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-form4-crear-editar-actividad',
  standalone: true,
  imports: [CommonModule, AlertaInformativoComponent, ReactiveFormsModule],
  templateUrl: './form4-crear-editar-actividad.component.html',
  styleUrl: './form4-crear-editar-actividad.component.css'
})
export class Form4CrearEditarActividadComponent {

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
      nameActividad: ['', [Validators.required, Validators.maxLength(120)]],
      tipoactividad: ['', [Validators.required]],
      startDate: ['', [Validators.required]],
      endDate: ['', [Validators.required]],
      descripcionActividad: ['', [Validators.required, Validators.maxLength(500)]],
      responsable: ['', [Validators.maxLength(80)]],
      ubicacion: ['', [Validators.maxLength(80)]],
      modalidad: ['', [Validators.required]],
      participantes: ['', [Validators.maxLength(3), Validators.min(0), Validators.max(999)]],
      tiempo: ['', [Validators.maxLength(3), Validators.min(0), Validators.max(999)]],
      costos: ['', [Validators.maxLength(10)]],
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
    const periodo = this._authcations.periodo();
    const path = `Empresas/${nit}/periodos/${periodo}/009-plan-anual-trabajo-actividades`;
    const raw = this.agregarActividadForm.value;
    // Normaliza meta y valorReal a 0 si vienen vacíos
   
    try {
      if (this.modo === 'editar' && this.datosEdicion?.id) {

        await this._firestore.updateDocument(`${path}/${this.datosEdicion.id}`, raw);
        this._alerta.showSuccess('Actividad actualizada exitosamente.');
      } else {
        const payload = {
          ...raw,
          status: 'Programada',
          planAnualtrabajoId: this.programIdForCreate
        };
        await this._firestore.createDocument(path, payload);
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
      nameActividad: this.datosEdicion.nameActividad ?? '',
      tipoactividad: this.datosEdicion.tipoactividad ?? '',
      startDate: this.datosEdicion.startDate ?? '',
      endDate: this.datosEdicion.endDate ?? '',
      descripcionActividad: this.datosEdicion.descripcionActividad ?? '',
      responsable: this.datosEdicion.responsable ?? '',
      ubicacion: this.datosEdicion.ubicacion ?? '',
      modalidad: this.datosEdicion.modalidad ?? '',
      participantes: this.datosEdicion.participantes ?? '0',
      tiempo: this.datosEdicion.tiempo ?? '',
      costos: this.datosEdicion.costos ?? '',
    });
  }

  // Resetear formulario a estado inicial
  private resetForm() {
    this.agregarActividadForm.reset();
    this.agregarActividadForm.patchValue({ participantes: '0' });
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
