import { CommonModule } from '@angular/common';
import { Component, signal, inject, input, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AlertaService } from '../../../../../services/shared/alerta.service';
import { FirestoreService } from '../../../../../services/shared/firestore.service';
import { AuthenticacionService } from '../../../../../services/shared/authenticacion.service';
import { Models } from '../../../../../interfaces/models';

@Component({
  selector: 'app-form1-competencia',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './form1-competencia.component.html',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  styleUrl: './form1-competencia.component.css'
})
export class Form1CompetenciaComponent {

  private _authcations = inject(AuthenticacionService);
  private _firestore = inject(FirestoreService);
  public _alerta = inject(AlertaService);

  /** Cargos detectados en los colaboradores del Diagnóstico, para sugerir. */
  cargosSugeridos = input<string[]>([]);

  mostrarModal = signal<boolean>(false);
  guardando = signal<boolean>(false);

  competenciaForm: FormGroup;
  modo: 'crear' | 'editar' = 'crear';
  datosEdicion: Models.Formacion.ConsultarCompetencia | null = null;

  niveles = ['Básico', 'Intermedio', 'Avanzado'];
  verificaciones = [
    'Certificado de formación',
    'Licencia de conducción vigente',
    'Evaluación teórica',
    'Evaluación práctica',
    'Experiencia acreditada',
    'Examen médico ocupacional',
  ];

  constructor(private fb: FormBuilder) {
    this.competenciaForm = this.fb.group({
      cargo: ['', [Validators.required, Validators.maxLength(80)]],
      competencia: ['', [Validators.required, Validators.maxLength(300)]],
      nivelRequerido: ['', [Validators.required]],
      formaVerificacion: ['', [Validators.required]],
      obligatoria: [true],
    });
  }

  abrirModal(modo: 'crear' | 'editar', datosEditar?: Models.Formacion.ConsultarCompetencia) {
    this.modo = modo;
    this.competenciaForm.reset({ obligatoria: true });

    if (modo === 'editar' && datosEditar) {
      this.datosEdicion = datosEditar;
      this.competenciaForm.patchValue({
        cargo: datosEditar.cargo,
        competencia: datosEditar.competencia,
        nivelRequerido: datosEditar.nivelRequerido,
        formaVerificacion: datosEditar.formaVerificacion,
        obligatoria: datosEditar.obligatoria,
      });
    } else {
      this.datosEdicion = null;
    }

    this.mostrarModal.set(true);
  }

  cerrarModal() {
    this.competenciaForm.reset({ obligatoria: true });
    this.datosEdicion = null;
    this.mostrarModal.set(false);
  }

  async handleSave() {
    if (!this.competenciaForm.valid) {
      this.competenciaForm.markAllAsTouched();
      this._alerta.showWarning('Por favor, completa el formulario correctamente.');
      return;
    }

    const nit = this._authcations.getCurrentUser().displayName;
    const periodo = this._authcations.periodo();
    const path = `Empresas/${nit}/periodos/${periodo}/010-competencia-plan-anual-formacion-competencias`;
    const datos = this.competenciaForm.value as Models.Formacion.Competencia;

    this.guardando.set(true);
    try {
      if (this.modo === 'editar' && this.datosEdicion) {
        await this._firestore.updateDocument(`${path}/${this.datosEdicion.id}`, datos);
        this._alerta.showSuccess('Competencia actualizada exitosamente.');
      } else {
        await this._firestore.createDocument(path, datos);
        this._alerta.showSuccess('Competencia creada exitosamente.');
      }
      this.cerrarModal();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error al guardar la competencia';
      console.error('[Form1Competencia] handleSave:', error);
      this._alerta.showError(msg);
    } finally {
      this.guardando.set(false);
    }
  }

  handleCancel() {
    this.cerrarModal();
  }
}
