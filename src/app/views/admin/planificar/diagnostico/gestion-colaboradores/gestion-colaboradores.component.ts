import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DonutComponent } from '../../../../../components/apexChart/donut/donut.component';
import { ColumnsStrackedNumericoComponent } from '../../../../../components/apexChart/columns-stracked-numerico/columns-stracked-numerico.component';
import { ColumnsBarHorizontalComponent, CauseData } from '../../../../../components/apexChart/columns-bar-horizontal/columns-bar-horizontal.component';
import { LineColumnComponent } from '../../../../../components/apexChart/line-column/line-column.component';
import { AuthenticacionService } from '../../../../../services/shared/authenticacion.service';
import { DiagnosticoDatosService } from '../../../../../services/shared/diagnostico-datos.service';
import { Models } from '../../../../../interfaces/models';

@Component({
  selector: 'app-gestion-colaboradores',
  standalone: true,
  imports: [CommonModule, RouterLink, DonutComponent, ColumnsStrackedNumericoComponent, ColumnsBarHorizontalComponent, LineColumnComponent],
  templateUrl: './gestion-colaboradores.component.html',
  styleUrl: './gestion-colaboradores.component.css'
})
export class GestionColaboradoresComponent implements OnInit {

  private _auth = inject(AuthenticacionService);
  private _datos = inject(DiagnosticoDatosService);

  colaboradores: any[] = [];
  cargando = true;

  /** Por que no se pudieron leer los datos. Vacio si todo fue bien. */
  error = '';

  // ── Fila 1: perfil demográfico / laboral ───────────────────────────────
  generoLabels:   string[] = []; generoSeries:   number[] = [];
  contratoLabels: string[] = []; contratoSeries: number[] = [];
  escolaridadLabels: string[] = []; escolaridadSeries: number[] = [];

  // ── Fila 2: género por área ────────────────────────────────────────────
  lineColumnLabels:    string[] = [];
  lineColumnFemenino:  number[] = [];
  lineColumnMasculino: number[] = [];
  lineColumnPct:       number[] = [];

  // ── Fila 3: perfil vial ────────────────────────────────────────────────
  conductorLabels:     string[] = []; conductorSeries:     number[] = [];
  capacitacionLabels:  string[] = []; capacitacionSeries:  number[] = [];
  siniestrosLabels:    string[] = []; siniestrosSeries:    number[] = [];

  // ── Stats rápidas ──────────────────────────────────────────────────────
  total            = 0;
  totalConductores = 0;
  conCapacitacion  = 0;
  conSiniestros    = 0;
  conInfracciones  = 0;
  conLicencia      = 0;


  async ngOnInit() {
    // Se espera a que Firebase resuelva la sesion: en una recarga en frio
    // todavia no hay NIT y la ruta de la consulta saldria mal formada.
    if (!await this._auth.waitForUser()) return;
    try {
      const datos = await this._datos.todos<any>('colaboradores');
      this.colaboradores = datos;
      this._calcular(datos);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'No se pudieron cargar los datos';
      console.error('[GestionColaboradores] cargar:', error);
      this.error = msg;
    } finally {
      this.cargando = false;
    }
  }

  private _calcular(data: any[]) {
    this.total = data.length;

    // Fila 1
    this._setDonut(data, 'genero',       'generoLabels',       'generoSeries');
    this._setDonut(data, 'tipoContrato', 'contratoLabels',     'contratoSeries');
    this._setDonut(data, 'escolaridad',  'escolaridadLabels',  'escolaridadSeries');

    // Fila 2: género por área
    this._calcularLineColumn(data);

    // Fila 3
    this._setBoolDonut(data, 'rolConductorLaboral',       'conductorLabels',    'conductorSeries',    'Conductor laboral', 'No conductor');
    this._setBoolDonut(data, 'capacitacionSeguridadVial', 'capacitacionLabels', 'capacitacionSeries', 'Con capacitación',  'Sin capacitación');
    this._setBoolDonut(data, 'haTenidoSiniestros',        'siniestrosLabels',   'siniestrosSeries',   'Con siniestros',    'Sin siniestros');

    // Stats
    this.totalConductores = data.filter(c => c.rolConductorLaboral      === 'SI').length;
    this.conCapacitacion  = data.filter(c => c.capacitacionSeguridadVial === 'SI').length;
    this.conSiniestros    = data.filter(c => c.haTenidoSiniestros        === 'SI').length;
    this.conInfracciones  = data.filter(c => c.tieneInfracciones         === 'SI').length;
    this.conLicencia      = data.filter(c => c.tieneLicencia             === 'SI').length;
  }

  private _calcularLineColumn(data: any[]) {
    const areas: Record<string, { f: number; m: number }> = {};
    for (const c of data) {
      const area = c.areaDepartamento || 'Sin área';
      if (!areas[area]) areas[area] = { f: 0, m: 0 };
      if (c.genero === 'Femenino') areas[area].f++;
      else areas[area].m++;
    }
    const total = data.length || 1;
    this.lineColumnLabels    = Object.keys(areas);
    this.lineColumnFemenino  = this.lineColumnLabels.map(a => areas[a].f);
    this.lineColumnMasculino = this.lineColumnLabels.map(a => areas[a].m);
    this.lineColumnPct       = this.lineColumnLabels.map(a =>
      Math.round(((areas[a].f + areas[a].m) / total) * 10000) / 100
    );
  }

  /** Agrupa por campo libre */
  private _setDonut(data: any[], campo: string, lKey: string, sKey: string) {
    const agrup = data.reduce((acc, item) => {
      const key = item[campo] || 'Sin definir';
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    (this as any)[lKey] = Object.keys(agrup);
    (this as any)[sKey] = Object.values(agrup);
  }

  /** Agrupa SI / NO con etiquetas legibles */
  private _setBoolDonut(data: any[], campo: string, lKey: string, sKey: string, labelSi: string, labelNo: string) {
    const si  = data.filter(c => c[campo] === 'SI').length;
    const no  = data.filter(c => c[campo] !== 'SI').length;
    const labels: string[] = []; const series: number[] = [];
    if (si > 0) { labels.push(labelSi); series.push(si); }
    if (no > 0) { labels.push(labelNo); series.push(no); }
    (this as any)[lKey] = labels;
    (this as any)[sKey] = series;
  }

  get contratoData(): CauseData[] {
    const total = this.contratoSeries.reduce((s, v) => s + v, 0);
    return this.contratoLabels.map((label, i) => ({
      causa: label,
      porcentaje: total > 0 ? Math.round((this.contratoSeries[i] / total) * 1000) / 10 : 0
    }));
  }

}
