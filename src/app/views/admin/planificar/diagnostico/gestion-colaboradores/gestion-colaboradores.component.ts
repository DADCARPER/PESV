import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { DonutComponent } from '../../../../../components/apexChart/donut/donut.component';
import { AuthenticacionService } from '../../../../../services/shared/authenticacion.service';
import { FirestoreService } from '../../../../../services/shared/firestore.service';
import { Models } from '../../../../../interfaces/models';

@Component({
  selector: 'app-gestion-colaboradores',
  standalone: true,
  imports: [CommonModule, RouterLink, DonutComponent],
  templateUrl: './gestion-colaboradores.component.html',
  styleUrl: './gestion-colaboradores.component.css'
})
export class GestionColaboradoresComponent implements OnInit, OnDestroy {

  private _auth = inject(AuthenticacionService);
  private _firestore = inject(FirestoreService);

  colaboradores: any[] = [];
  cargando = true;

  // ── Fila 1: perfil demográfico / laboral ───────────────────────────────
  generoLabels:   string[] = []; generoSeries:   number[] = [];
  contratoLabels: string[] = []; contratoSeries: number[] = [];
  escolaridadLabels: string[] = []; escolaridadSeries: number[] = [];

  // ── Fila 2: perfil vial ────────────────────────────────────────────────
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

  private _sub?: Subscription;

  ngOnInit() {
    const nit = this._auth.getCurrentUser().displayName;
    const periodo = this._auth.periodo();
    const path = `Empresas/${nit}/periodos/${periodo}/006-diagnostico-colaboradores`;
    const q: Models.Firebases.whereQuery[] = [['estado', '==', 'Activo']];

    this._sub = this._firestore
      .getDocumentsQueryChanges<any>(path, q)
      .subscribe(res => {
        this.colaboradores = res;
        this._calcular(res);
        this.cargando = false;
      });
  }

  private _calcular(data: any[]) {
    this.total = data.length;

    // Fila 1
    this._setDonut(data, 'genero',       'generoLabels',       'generoSeries');
    this._setDonut(data, 'tipoContrato', 'contratoLabels',     'contratoSeries');
    this._setDonut(data, 'escolaridad',  'escolaridadLabels',  'escolaridadSeries');

    // Fila 2
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

  ngOnDestroy() { this._sub?.unsubscribe(); }
}
