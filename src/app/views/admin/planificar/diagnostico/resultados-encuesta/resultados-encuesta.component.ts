import { Component, OnInit, OnDestroy, inject, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FirestoreService } from '../../../../../services/shared/firestore.service';
import { AuthenticacionService } from '../../../../../services/shared/authenticacion.service';
import { Subscription } from 'rxjs';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-resultados-encuesta',
  standalone: true,
  imports: [CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './resultados-encuesta.component.html'
})
export class ResultadosEncuestaComponent implements OnInit, OnDestroy {

  private _firestore = inject(FirestoreService);
  private _auth    = inject(AuthenticacionService);

  todasLasRespuestas: any[] = [];
  respuestasFiltradas: any[] = [];
  periodos: number[] = [];
  periodoSeleccionado: number | null = null;
  cargando = true;

  private _sub?: Subscription;

  get total(): number { return this.respuestasFiltradas.length; }

  ngOnInit(): void {
    const nit = this._auth.getCurrentUser()?.displayName ?? '';
    const path = `Encuestas_publicas/${nit}/encuestas`;

    this._sub = this._firestore.getDocumentsChanges<any>(path).subscribe(snap => {
      this.todasLasRespuestas = snap;

      const anios = [...new Set(this.todasLasRespuestas.map(r => this._getAnio(r.docCreado)))]
        .sort((a, b) => b - a);
      this.periodos = anios;

      if (this.periodoSeleccionado === null && anios.length > 0) {
        this.periodoSeleccionado = anios[0];
      }

      this._filtrar();
      this.cargando = false;
    });
  }

  seleccionarPeriodo(anio: number): void {
    this.periodoSeleccionado = anio;
    this._filtrar();
  }

  private _filtrar(): void {
    if (this.periodoSeleccionado === null) {
      this.respuestasFiltradas = [...this.todasLasRespuestas];
    } else {
      this.respuestasFiltradas = this.todasLasRespuestas
        .filter(r => this._getAnio(r.docCreado) === this.periodoSeleccionado);
    }
  }

  private _getAnio(docCreado: any): number {
    if (!docCreado) return new Date().getFullYear();
    if (typeof docCreado.toDate === 'function') return (docCreado.toDate() as Date).getFullYear();
    return new Date(docCreado).getFullYear();
  }

  getFecha(docCreado: any): string {
    if (!docCreado) return '—';
    const d: Date = typeof docCreado.toDate === 'function' ? docCreado.toDate() : new Date(docCreado);
    return d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  private _arr(val: any): string {
    if (Array.isArray(val)) return val.join(', ');
    return val ?? '';
  }

  exportarExcel(): void {
    const filas = this.respuestasFiltradas.map(r => ({
      // ── Módulo 1: Información personal y laboral ──
      'Nombre':                    r.nombre               ?? '',
      'Documento':                 r.documento            ?? '',
      'Fecha Nacimiento':          r.fechaNacimiento      ?? '',
      'Género':                    r.genero               ?? '',
      'Teléfono':                  r.telefono             ?? '',
      'Email':                     r.email                ?? '',
      'Escolaridad':               r.escolaridad          ?? '',
      'Estrato':                   r.estrato              ?? '',
      'Estado Civil':              r.estadoCivil          ?? '',
      'Cargo':                     r.cargo                ?? '',
      'Área / Departamento':       r.areaDepartamento     ?? '',
      'Jornada':                   r.jornada              ?? '',
      'Horas Laborales':           r.horasLaborales       ?? '',
      'Tiempo en Empresa (años)':  r.tiempoEmpresa        ?? '',
      'Tipo Contrato':             r.tipoContrato         ?? '',
      // ── Módulo 2: Salud y condición física ──
      'Estado General Salud':      r.estadoGeneral        ?? '',
      'Limitación Física':         r.limitacionFisica     ?? '',
      'Incapacidades':             r.incapacidades        ?? '',
      'Actividad Física':          r.actividadFisica      ?? '',
      'Dolor / Molestia':          r.dolorMolestia        ?? '',
      'Discapacidad':              r.discapacidad         ?? '',
      // ── Módulo 3: Conducción y transporte ──
      'Conduce Vehículos':         r.conduceVehiculos     ?? '',
      'Tipo de Vehículos':         this._arr(r.tipoVehiculos),
      'Licencia de Conducción':    r.licenciaConduccion   ?? '',
      'Categoría Licencia':        r.categoriaLicencia    ?? '',
      'Frecuencia Conducción':     r.frecuenciaConduccion ?? '',
      'Experiencia Conducción':    r.experienciaConduccion?? '',
      'Uso Cinturón':              r.usoCinturon          ?? '',
      'Accidente de Tránsito':     r.accidenteTransito    ?? '',
      'Conocimiento Normas':       r.conocimientoNormas   ?? '',
      'Capacidad Emergencia':      r.capacidadEmergencia  ?? '',
      // ── Módulo 4: Desplazamientos laborales ──
      'Medios de Transporte':      this._arr(r.mediosTransporte),
      'Tiempo Desplazamiento':     r.tiempoDesplazamiento ?? '',
      'Estado de Vías':            r.estadoVias           ?? '',
      'Incidentes Desplazamiento': r.incidentesDesplazamiento ?? '',
      'Seguridad Desplazamiento':  r.seguridadDesplazamiento  ?? '',
      // ── Módulo 5: Identificación de riesgos ──
      'Exposición a Riesgos':      r.exposicionRiesgos    ?? '',
      'Experiencia con Riesgos':   r.experienciaRiesgos   ?? '',
      'Situaciones de Riesgo':     this._arr(r.situacionesRiesgo),
      'Reporte de Riesgo':         r.reporteRiesgo        ?? '',
      'Conocimiento Reporte':      r.conocimientoReporte  ?? '',
      'Cultura de Seguridad':      r.culturaSeguridad     ?? '',
      'Preparación ante Riesgos':  r.preparacionRiesgos   ?? '',
      // ── Módulo 6: Mejora y participación ──
      'Aportar Ideas':             r.aportarIdeas         ?? '',
      'Participación Actividades': r.participacionActividades ?? '',
      'Acciones de Mejora':        this._arr(r.accionesMejora),
      'Participación Anterior':    r.participacionAnterior?? '',
      'Sugerencias de Mejora':     r.sugerenciasMejora    ?? '',
      // ── Metadatos ──
      'Fecha Envío':               this.getFecha(r.docCreado)
    }));

    const ws = XLSX.utils.json_to_sheet(filas);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Respuestas');
    XLSX.writeFile(wb, `encuesta_${this.periodoSeleccionado ?? 'todos'}.xlsx`);
  }

  ngOnDestroy(): void {
    this._sub?.unsubscribe();
  }
}
