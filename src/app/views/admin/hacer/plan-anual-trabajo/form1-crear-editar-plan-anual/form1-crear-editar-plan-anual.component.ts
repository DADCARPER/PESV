import { Component, inject, signal } from '@angular/core';
import { Models } from '../../../../../interfaces/models';
import { AuthenticacionService } from '../../../../../services/shared/authenticacion.service';
import { FirestoreService } from '../../../../../services/shared/firestore.service';
import { AlertaService } from '../../../../../services/shared/alerta.service';
import { ProgramasService } from '../../../planificar/programas/programas.service';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AlertaInformativoComponent } from '../../../../../components/alertas/alerta-informativo/alerta-informativo.component';

@Component({
  selector: 'app-form1-crear-editar-plan-anual',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, AlertaInformativoComponent],
  templateUrl: './form1-crear-editar-plan-anual.component.html',
  styleUrl: './form1-crear-editar-plan-anual.component.css'
})
export class Form1CrearEditarPlanAnualComponent {

  private _authcations = inject(AuthenticacionService);
  private _firestore = inject(FirestoreService);
  public _alerta = inject(AlertaService);
  private _programas = inject(ProgramasService);

  // Signal para controlar la visibilidad del modal (igual que app-form1-sedes)
  mostrarModal = signal<boolean>(false);
  currentYear = new Date().getFullYear();
  // Formulario reactivo
  agregarActividadForm: FormGroup;

  // Modo del formulario y datos cuando es edición
  modo: 'crear' | 'editar';
  datosEdicion: Models.PlanTrabajo.ConsultarPlanTrabajo | null = null;

  constructor(private fb: FormBuilder) {
    this.agregarActividadForm = this.fb.group({
      objetivoGestion: ['', [Validators.required, Validators.maxLength(500)]],
      metaGestion: ['', [Validators.required, Validators.maxLength(3), Validators.min(0), Validators.max(100)]],
      anoActual: [this.currentYear, [Validators.required]],
    });
  }

  // Abrir modal. Permite pasar datos cuando es edición o contexto cuando es creación
  abrirModal(modo: 'crear' | 'editar', datos?: Models.PlanTrabajo.ConsultarPlanTrabajo) {
    this.mostrarModal.set(true);
    this.modo = modo;
    if (modo === 'editar' && datos) {
      this.datosEdicion = datos;
      this.cargarDatos();
    } else if (modo === 'crear' && datos) {
      // modo crear
      this.datosEdicion = null;
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
    const path = `Empresas/${nit}/periodos/${periodo}/009-plan-anual-trabajo`;
    const valorFormulario = this.agregarActividadForm.value;
    
    try {
      if (this.modo === 'editar' && this.datosEdicion?.id) {
        await this._firestore.updateDocument(`${path}/${this.datosEdicion.id}`, valorFormulario);
        this._alerta.showSuccess('Actividad actualizada exitosamente.');
      } else {
        // crear: 
        const raw = {
          ...valorFormulario,
          totalActividades: 0, // valor por defecto
          totalActividadesCompletadas: 0, // valor por defecto
          totalActividadesPendientes: 0, // valor por defecto
          totalActividadesVencidas: 0, // valor por defecto
        };
        await this._firestore.createDocument(path, raw);
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
      objetivoGestion: this.datosEdicion.objetivoGestion ?? '',
      metaGestion: this.datosEdicion.metaGestion ?? '',
      anoActual: this.datosEdicion.anoActual ?? this.currentYear
    });
  }

  // Resetear formulario a estado inicial
  private resetForm() {
    this.agregarActividadForm.reset();
    this.agregarActividadForm.patchValue({ metaGestion: '0' });
    this.agregarActividadForm.patchValue({ objetivoGestion: '' });
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
