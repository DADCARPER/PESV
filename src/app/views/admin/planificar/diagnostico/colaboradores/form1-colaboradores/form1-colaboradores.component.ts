import { CommonModule } from '@angular/common';
import { Component, signal, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthenticacionService } from '../../../../../../services/shared/authenticacion.service';
import { FirestoreService } from '../../../../../../services/shared/firestore.service';
import { AlertaService } from '../../../../../../services/shared/alerta.service';

@Component({
  selector: 'app-form1-colaboradores',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './form1-colaboradores.component.html',
  styleUrl: './form1-colaboradores.component.css'
})
export class Form1ColaboradoresComponent {

  private _authcations = inject(AuthenticacionService);
  private _firestore = inject(FirestoreService);
  public _alerta = inject(AlertaService);

  mostrarModal = signal<boolean>(false);
  colaboradorForm: FormGroup;

  modo: 'crear' | 'editar' = 'crear';
  datosEdicion: any = null;

  // Categorías de licencia (multi-selección)
  readonly todasCategorias = ['A1', 'A2', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3'];
  categoriasSeleccionadas: string[] = [];

  constructor(private fb: FormBuilder) {
    this.colaboradorForm = this.fb.group({
      // ── Datos personales ──────────────────────────────────────
      nombre:          ['', Validators.required],
      fechaNacimiento: ['', Validators.required],
      genero:          ['', Validators.required],
      documento:       ['', Validators.required],
      telefono:        [''],
      email:           [''],
      // ── Datos laborales ───────────────────────────────────────
      cargo:           ['', Validators.required],
      jornada:         ['', Validators.required],
      escolaridad:     ['', Validators.required],
      estrato:         ['', Validators.required],
      estadoCivil:     ['', Validators.required],
      tipoContrato:    ['', Validators.required],
      tiempoEmpresa:   ['', Validators.required],
      horasLaborales:  ['', Validators.required],
      areaDepartamento: [''],
      // ── Movilidad hacia el trabajo ────────────────────────────
      conduce:                [''],
      medioTransporteTrabajo: [''],
      // ── Conducción laboral ────────────────────────────────────
      rolConductorLaboral:    [''],
      tipoVehiculoConduce:    [''],
      // ── Licencia de conducción ────────────────────────────────
      tieneLicencia:          [''],
      numeroLicencia:         [''],
      vigenciaLicencia:       [''],
      // categoriaLicencia se gestiona como string[] fuera del form
      // ── Capacitaciones ────────────────────────────────────────
      capacitacionSeguridadVial:      [''],
      fechaUltimaCapacitacion:        [''],
      evaluacionCompetenciaConduccion: [''],
      // ── Siniestros viales ─────────────────────────────────────
      haTenidoSiniestros:  [''],
      cantidadSiniestros:  [0, Validators.min(0)],
      // ── Infracciones de tránsito ──────────────────────────────
      tieneInfracciones:         [''],
      cantidadInfracciones:      [0, Validators.min(0)],
      estadoPagoInfracciones:    [''],
    });
  }

  // ── Getters de visibilidad condicional ─────────────────────────────────
  get mostrarTipoVehiculo(): boolean {
    return this.colaboradorForm.get('rolConductorLaboral')?.value === 'SI';
  }
  get mostrarLicencia(): boolean {
    return this.colaboradorForm.get('tieneLicencia')?.value === 'SI';
  }
  get mostrarCapacitacionDetalle(): boolean {
    return this.colaboradorForm.get('capacitacionSeguridadVial')?.value === 'SI';
  }
  get mostrarCantidadSiniestros(): boolean {
    return this.colaboradorForm.get('haTenidoSiniestros')?.value === 'SI';
  }
  get mostrarDetalleInfracciones(): boolean {
    return this.colaboradorForm.get('tieneInfracciones')?.value === 'SI';
  }

  // ── Categorías licencia (multi-checkbox) ───────────────────────────────
  toggleCategoria(cat: string) {
    const idx = this.categoriasSeleccionadas.indexOf(cat);
    if (idx === -1) this.categoriasSeleccionadas.push(cat);
    else            this.categoriasSeleccionadas.splice(idx, 1);
  }
  tieneCategoria(cat: string): boolean {
    return this.categoriasSeleccionadas.includes(cat);
  }

  // ── Modal ──────────────────────────────────────────────────────────────
  cerrarModal() {
    this.colaboradorForm.reset({
      nombre: '', fechaNacimiento: '', genero: '', documento: '',
      telefono: '', email: '',
      cargo: '', jornada: '', escolaridad: '', estrato: '',
      estadoCivil: '', tipoContrato: '', tiempoEmpresa: '',
      horasLaborales: '', areaDepartamento: '',
      conduce: '', medioTransporteTrabajo: '',
      rolConductorLaboral: '', tipoVehiculoConduce: '',
      tieneLicencia: '', numeroLicencia: '', vigenciaLicencia: '',
      capacitacionSeguridadVial: '', fechaUltimaCapacitacion: '',
      evaluacionCompetenciaConduccion: '',
      haTenidoSiniestros: '', cantidadSiniestros: 0,
      tieneInfracciones: '', cantidadInfracciones: 0, estadoPagoInfracciones: '',
    });
    this.categoriasSeleccionadas = [];
    this.mostrarModal.set(false);
  }

  abrirModal(modo: 'crear' | 'editar', datosEditar?: any) {
    this.modo = modo;
    this.datosEdicion = datosEditar ?? null;
    if (modo === 'editar' && datosEditar) {
      this.colaboradorForm.patchValue(datosEditar);
      this.categoriasSeleccionadas = Array.isArray(datosEditar.categoriaLicencia)
        ? [...datosEditar.categoriaLicencia]
        : [];
    }
    this.mostrarModal.set(true);
  }

  async handleSave() {
    if (!this.colaboradorForm.valid) {
      this.colaboradorForm.markAllAsTouched();
      this._alerta.showWarning('Por favor, completa el formulario correctamente.');
      return;
    }
    const nit = this._authcations.getCurrentUser().displayName;
    const periodo = this._authcations.periodo();
    const path = `Empresas/${nit}/periodos/${periodo}/006-diagnostico-colaboradores`;
    const data = { ...this.colaboradorForm.value, categoriaLicencia: this.categoriasSeleccionadas };

    try {
      if (this.modo === 'editar') {
        await this._firestore.updateDocument(`${path}/${this.datosEdicion.id}`, data);
        this._alerta.showSuccess('Colaborador actualizado exitosamente.');
      } else {
        await this._firestore.createDocument(path, data);
        this._alerta.showSuccess('Colaborador creado exitosamente.');
      }
      this.cerrarModal();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error al guardar el colaborador';
      console.error('[Form1Colaboradores] handleSave:', error);
      this._alerta.showError(msg);
    }
  }

  handleCancel() { this.cerrarModal(); }
}
