import { CommonModule } from '@angular/common';
import { Component, signal, inject, input, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AlertaService } from '../../../../../services/shared/alerta.service';
import { FirestoreService } from '../../../../../services/shared/firestore.service';
import { AuthenticacionService } from '../../../../../services/shared/authenticacion.service';
import { Models } from '../../../../../interfaces/models';

@Component({
  selector: 'app-form1-capacitacion',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './form1-capacitacion.component.html',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  styleUrl: './form1-capacitacion.component.css'
})
export class Form1CapacitacionComponent {

  private _authcations = inject(AuthenticacionService);
  private _firestore = inject(FirestoreService);
  public _alerta = inject(AlertaService);

  /** Cargos de la matriz de competencias y del Diagnóstico. */
  cargosSugeridos = input<string[]>([]);
  /** Colaboradores del Diagnóstico, para registrar asistentes. */
  colaboradores = input<string[]>([]);

  mostrarModal = signal<boolean>(false);
  guardando = signal<boolean>(false);

  /** Cargos y asistentes se manejan fuera del form: son listas de selección múltiple. */
  cargosDirigidos = signal<string[]>([]);
  asistentes = signal<string[]>([]);

  capacitacionForm: FormGroup;
  modo: 'crear' | 'editar' = 'crear';
  datosEdicion: Models.Formacion.ConsultarCapacitacion | null = null;

  modalidades = ['Presencial', 'Virtual', 'Mixta'];
  estados: Models.Formacion.EstadoCapacitacion[] = ['Programada', 'Realizada', 'Cancelada'];

  constructor(private fb: FormBuilder) {
    this.capacitacionForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(150)]],
      objetivo: ['', [Validators.maxLength(300)]],
      modalidad: ['', [Validators.required]],
      intensidadHoras: [null, [Validators.required, Validators.min(1)]],
      responsable: ['', [Validators.required, Validators.maxLength(80)]],
      fechaProgramada: ['', [Validators.required]],
      estadoCapacitacion: ['Programada', [Validators.required]],
      fechaEjecucion: [null],
    });
  }

  /** La fecha de ejecución solo tiene sentido cuando ya se dictó. */
  get exigeFechaEjecucion(): boolean {
    return this.capacitacionForm.get('estadoCapacitacion')?.value === 'Realizada';
  }

  alternarCargo(cargo: string) {
    const actuales = this.cargosDirigidos();
    this.cargosDirigidos.set(
      actuales.includes(cargo) ? actuales.filter(c => c !== cargo) : [...actuales, cargo]
    );
  }

  alternarAsistente(nombre: string) {
    const actuales = this.asistentes();
    this.asistentes.set(
      actuales.includes(nombre) ? actuales.filter(a => a !== nombre) : [...actuales, nombre]
    );
  }

  abrirModal(modo: 'crear' | 'editar', datosEditar?: Models.Formacion.ConsultarCapacitacion) {
    this.modo = modo;
    this.capacitacionForm.reset({ estadoCapacitacion: 'Programada', fechaEjecucion: null });
    this.cargosDirigidos.set([]);
    this.asistentes.set([]);

    if (modo === 'editar' && datosEditar) {
      this.datosEdicion = datosEditar;
      this.capacitacionForm.patchValue({
        nombre: datosEditar.nombre,
        objetivo: datosEditar.objetivo,
        modalidad: datosEditar.modalidad,
        intensidadHoras: datosEditar.intensidadHoras,
        responsable: datosEditar.responsable,
        fechaProgramada: datosEditar.fechaProgramada,
        estadoCapacitacion: datosEditar.estadoCapacitacion,
        fechaEjecucion: datosEditar.fechaEjecucion,
      });
      this.cargosDirigidos.set(datosEditar.cargosDirigidos ?? []);
      this.asistentes.set(datosEditar.asistentes ?? []);
    } else {
      this.datosEdicion = null;
    }

    this.mostrarModal.set(true);
  }

  cerrarModal() {
    this.capacitacionForm.reset({ estadoCapacitacion: 'Programada', fechaEjecucion: null });
    this.cargosDirigidos.set([]);
    this.asistentes.set([]);
    this.datosEdicion = null;
    this.mostrarModal.set(false);
  }

  async handleSave() {
    if (!this.capacitacionForm.valid) {
      this.capacitacionForm.markAllAsTouched();
      this._alerta.showWarning('Por favor, completa el formulario correctamente.');
      return;
    }

    if (this.cargosDirigidos().length === 0) {
      this._alerta.showWarning('Selecciona al menos un cargo al que se dirige la capacitación.');
      return;
    }

    if (this.exigeFechaEjecucion && !this.capacitacionForm.get('fechaEjecucion')?.value) {
      this._alerta.showWarning('Indica la fecha en que se realizó la capacitación.');
      return;
    }

    const nit = this._authcations.getCurrentUser().displayName;
    const periodo = this._authcations.periodo();
    const path = `Empresas/${nit}/periodos/${periodo}/010-competencia-plan-anual-formacion-capacitaciones`;

    const datos: Models.Formacion.Capacitacion = {
      ...this.capacitacionForm.value,
      // Si vuelve a 'Programada' o 'Cancelada', la fecha de ejecución deja de aplicar
      fechaEjecucion: this.exigeFechaEjecucion ? this.capacitacionForm.value.fechaEjecucion : null,
      cargosDirigidos: this.cargosDirigidos(),
      asistentes: this.asistentes(),
    };

    this.guardando.set(true);
    try {
      if (this.modo === 'editar' && this.datosEdicion) {
        await this._firestore.updateDocument(`${path}/${this.datosEdicion.id}`, datos);
        this._alerta.showSuccess('Capacitación actualizada exitosamente.');
      } else {
        await this._firestore.createDocument(path, datos);
        this._alerta.showSuccess('Capacitación creada exitosamente.');
      }
      this.cerrarModal();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error al guardar la capacitación';
      console.error('[Form1Capacitacion] handleSave:', error);
      this._alerta.showError(msg);
    } finally {
      this.guardando.set(false);
    }
  }

  handleCancel() {
    this.cerrarModal();
  }
}
