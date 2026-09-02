import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, OnDestroy, inject, viewChild, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';

import { FirestoreService } from '../../../../services/shared/firestore.service';
import { AuthenticacionService } from '../../../../services/shared/authenticacion.service';
import { EstatusGeneralService } from '../../../../services/shared/estatus-general.service';
import { Models } from '../../../../interfaces/models';

import { Form1CompetenciaComponent } from './form1-competencia/form1-competencia.component';
import { Form2CompetenciaComponent } from './form2-competencia/form2-competencia.component';
import { Form1CapacitacionComponent } from './form1-capacitacion/form1-capacitacion.component';
import { Form2CapacitacionComponent } from './form2-capacitacion/form2-capacitacion.component';

const SLUG = '010-competencia-plan-anual-formacion';

@Component({
  selector: 'app-competencias-plan-anual-formacion',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    Form1CompetenciaComponent, Form2CompetenciaComponent,
    Form1CapacitacionComponent, Form2CapacitacionComponent,
  ],
  templateUrl: './competencias-plan-anual-formacion.component.html',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  styleUrl: './competencias-plan-anual-formacion.component.css'
})
export class CompetenciasPlanAnualFormacionComponent implements OnInit, OnDestroy {

  private _firestore = inject(FirestoreService);
  private _authcations = inject(AuthenticacionService);
  private _estatus = inject(EstatusGeneralService);

  modalCompetencia = viewChild.required<Form1CompetenciaComponent>('modalCompetencia');
  modalEliminarCompetencia = viewChild.required<Form2CompetenciaComponent>('modalEliminarCompetencia');
  modalCapacitacion = viewChild.required<Form1CapacitacionComponent>('modalCapacitacion');
  modalEliminarCapacitacion = viewChild.required<Form2CapacitacionComponent>('modalEliminarCapacitacion');

  /** 0 = matriz de competencias, 1 = plan anual de formación */
  pestana = signal<0 | 1>(0);

  competencias = signal<Models.Formacion.ConsultarCompetencia[]>([]);
  capacitaciones = signal<Models.Formacion.ConsultarCapacitacion[]>([]);
  colaboradores = signal<string[]>([]);
  cargando = signal<boolean>(true);

  /** Cargos de la matriz más los del Diagnóstico, sin repetir. */
  cargosSugeridos = computed(() => {
    const deMatriz = this.competencias().map(c => c.cargo);
    return [...new Set([...deMatriz, ...this.cargosDiagnostico()])].filter(Boolean).sort();
  });
  private cargosDiagnostico = signal<string[]>([]);

  capacitacionesRealizadas = computed(
    () => this.capacitaciones().filter(c => c.estadoCapacitacion === 'Realizada').length
  );

  private subs: Subscription[] = [];
  private nit: string | null = null;

  ngOnInit(): void {
    this.nit = this._authcations.getCurrentUser()?.displayName ?? null;
    this.consultarCompetencias();
    this.consultarCapacitaciones();
    this.consultarColaboradores();
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  private rutaPeriodo(sufijo: string): string {
    return `Empresas/${this.nit}/periodos/${this._authcations.periodo()}/${SLUG}-${sufijo}`;
  }

  consultarCompetencias() {
    const q: Models.Firebases.whereQuery[] = [['estado', '==', 'Activo']];
    const extras: Models.Firebases.extrasQuery = { orderParam: 'docCreado', directionSort: 'asc', limit: 200 };

    this.subs.push(
      this._firestore
        .getDocumentsQueryChanges<Models.Formacion.ConsultarCompetencia>(this.rutaPeriodo('competencias'), q, extras)
        .subscribe({
          next: (res) => {
            this.competencias.set(res);
            this.cargando.set(false);
            this.actualizarEstatusGeneral();
          },
          error: (error: unknown) => {
            console.error('[Formacion] consultarCompetencias:', error);
            this.cargando.set(false);
          }
        })
    );
  }

  consultarCapacitaciones() {
    const q: Models.Firebases.whereQuery[] = [['estado', '==', 'Activo']];
    const extras: Models.Firebases.extrasQuery = { orderParam: 'docCreado', directionSort: 'asc', limit: 200 };

    this.subs.push(
      this._firestore
        .getDocumentsQueryChanges<Models.Formacion.ConsultarCapacitacion>(this.rutaPeriodo('capacitaciones'), q, extras)
        .subscribe({
          next: (res) => {
            this.capacitaciones.set(res);
            this.actualizarEstatusGeneral();
          },
          error: (error: unknown) => console.error('[Formacion] consultarCapacitaciones:', error)
        })
    );
  }

  /** Nombres y cargos vienen del Diagnóstico; alimentan el selector de asistentes. */
  consultarColaboradores() {
    const periodo = this._authcations.periodo();
    const path = `Empresas/${this.nit}/periodos/${periodo}/006-diagnostico-colaboradores`;
    const q: Models.Firebases.whereQuery[] = [['estado', '==', 'Activo']];
    const extras: Models.Firebases.extrasQuery = { orderParam: 'docCreado', directionSort: 'desc', limit: 300 };

    this.subs.push(
      this._firestore
        .getDocumentsQueryChanges<Models.Diagnostico.Colaboradores>(path, q, extras)
        .subscribe({
          next: (res) => {
            this.colaboradores.set(res.map(c => c.nombre).filter(Boolean).sort());
            this.cargosDiagnostico.set([...new Set(res.map(c => c.cargo).filter(Boolean))]);
          },
          error: (error: unknown) => console.error('[Formacion] consultarColaboradores:', error)
        })
    );
  }

  // ── Competencias ──────────────────────────────────────────────────────────

  crearCompetencia() { this.modalCompetencia().abrirModal('crear'); }
  editarCompetencia(dato: Models.Formacion.ConsultarCompetencia) { this.modalCompetencia().abrirModal('editar', dato); }
  eliminarCompetencia(dato: Models.Formacion.ConsultarCompetencia) { this.modalEliminarCompetencia().abrirModal(dato); }

  // ── Capacitaciones ────────────────────────────────────────────────────────

  crearCapacitacion() { this.modalCapacitacion().abrirModal('crear'); }
  editarCapacitacion(dato: Models.Formacion.ConsultarCapacitacion) { this.modalCapacitacion().abrirModal('editar', dato); }
  eliminarCapacitacion(dato: Models.Formacion.ConsultarCapacitacion) { this.modalEliminarCapacitacion().abrirModal(dato); }

  /** Clases del distintivo de estado de una capacitación. */
  claseEstado(estado: Models.Formacion.EstadoCapacitacion): string {
    const base = 'text-xs font-semibold inline-block py-1 px-2 rounded';
    switch (estado) {
      case 'Realizada':  return `${base} text-emerald-600 bg-emerald-100`;
      case 'Cancelada':  return `${base} text-red-600 bg-red-100`;
      default:           return `${base} text-sky-600 bg-sky-100`;
    }
  }

  /** Una capacitación programada cuya fecha ya pasó está vencida. */
  estaVencida(cap: Models.Formacion.ConsultarCapacitacion): boolean {
    if (cap.estadoCapacitacion !== 'Programada' || !cap.fechaProgramada) return false;
    return new Date(cap.fechaProgramada) < new Date(new Date().toDateString());
  }

  /**
   * El módulo tiene dos entregables, así que cada uno vale la mitad:
   * la matriz de competencias existe, y el plan anual se está ejecutando.
   */
  private async actualizarEstatusGeneral(): Promise<void> {
    const competencias = this.competencias().length;
    const programadas = this.capacitaciones().length;
    const realizadas = this.capacitacionesRealizadas();

    const mitadMatriz = competencias > 0 ? 50 : 0;
    const mitadPlan = programadas > 0 ? Math.round((realizadas / programadas) * 50) : 0;

    const modulo: Models.Procesos.Modulo010Formacion = {
      total_progreso: mitadMatriz + mitadPlan,
      competenciasDefinidas: { total: competencias },
      capacitacionesProgramadas: { total: programadas },
      capacitacionesRealizadas: { total: realizadas },
    };

    await this._estatus.registrarProgreso(SLUG, modulo);
  }
}
