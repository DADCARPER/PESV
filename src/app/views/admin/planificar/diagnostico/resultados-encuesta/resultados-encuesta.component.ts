import { Component, OnInit, inject, CUSTOM_ELEMENTS_SCHEMA, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FirestoreService } from '../../../../../services/shared/firestore.service';
import { AuthenticacionService } from '../../../../../services/shared/authenticacion.service';
import { RolUsuarioService } from '../../../../../services/shared/rol-usuario.service';
import { AlertaService } from '../../../../../services/shared/alerta.service';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-resultados-encuesta',
  standalone: true,
  imports: [CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './resultados-encuesta.component.html'
})
export class ResultadosEncuestaComponent implements OnInit {

  private _firestore = inject(FirestoreService);
  private _auth    = inject(AuthenticacionService);
  private _rol     = inject(RolUsuarioService);
  private _alerta  = inject(AlertaService);

  /** Solo el operativo borra; el supervisor revisa. */
  get puedeBorrar(): boolean { return this._rol.editable(); }

  /**
   * Que se esta a punto de borrar: una respuesta concreta o todas las del
   * periodo. Se confirma aparte porque borrar respuestas destruye los datos
   * del diagnostico y no hay vuelta atras.
   */
  aBorrar = signal<{ tipo: 'una' | 'todas'; respuesta?: any } | null>(null);
  borrando = signal(false);

  todasLasRespuestas: any[] = [];
  respuestasFiltradas: any[] = [];
  periodos: number[] = [];
  periodoSeleccionado: number | null = null;
  cargando = true;

  get total(): number { return this.respuestasFiltradas.length; }

  private get ruta(): string {
    const nit = this._auth.getCurrentUser()?.displayName ?? '';
    return `Encuestas_publicas/${nit}/encuestas`;
  }

  ngOnInit(): void {
    this.cargar();
  }

  /**
   * Lectura puntual, no suscripcion. Es una pantalla de consulta: nadie
   * necesita ver aparecer respuestas en vivo, y mantener abierta una escucha
   * sobre la coleccion entera se paga con cada nueva respuesta.
   */
  async cargar(): Promise<void> {
    this.cargando = true;
    try {
      const snap = await this._firestore.getDocuments<any>(this.ruta);
      this.todasLasRespuestas = snap.docs.map(d => d.data());

      const anios = [...new Set(this.todasLasRespuestas.map(r => this._getAnio(r.docCreado)))]
        .sort((a, b) => b - a);
      this.periodos = anios;

      if (this.periodoSeleccionado === null && anios.length > 0) {
        this.periodoSeleccionado = anios[0];
      }

      this._filtrar();
    } catch (error: unknown) {
      console.error('[ResultadosEncuesta] cargar:', error);
      this._alerta.showError('No se pudieron cargar las respuestas.');
    } finally {
      this.cargando = false;
    }
  }

  // ── Borrado ───────────────────────────────────────────────────────────────

  pedirBorrarUna(respuesta: any): void {
    this.aBorrar.set({ tipo: 'una', respuesta });
  }

  pedirBorrarTodas(): void {
    this.aBorrar.set({ tipo: 'todas' });
  }

  cancelarBorrado(): void {
    this.aBorrar.set(null);
  }

  /**
   * Borra lo confirmado.
   *
   * Dejar el periodo sin respuestas devuelve la encuesta a editable en el
   * gestor del administrador: el candado no es un estado aparte, sale de que
   * haya o no respuestas contestadas.
   */
  async confirmarBorrado(): Promise<void> {
    const objetivo = this.aBorrar();
    if (!objetivo || !this.puedeBorrar) return;

    this.borrando.set(true);
    try {
      const aEliminar = objetivo.tipo === 'una'
        ? [objetivo.respuesta]
        : [...this.respuestasFiltradas];

      for (const respuesta of aEliminar) {
        await this._firestore.deleteDocument(`${this.ruta}/${respuesta.id}`);
      }

      this._alerta.showSuccess(aEliminar.length === 1
        ? 'Respuesta eliminada.'
        : `${aEliminar.length} respuestas eliminadas.`);

      this.aBorrar.set(null);
      await this.cargar();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'No se pudieron eliminar';
      console.error('[ResultadosEncuesta] borrar:', error);
      this._alerta.showError(msg);
    } finally {
      this.borrando.set(false);
    }
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

}
