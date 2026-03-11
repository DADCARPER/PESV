import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { DonutComponent } from '../../../../../components/apexChart/donut/donut.component';
import { AuthenticacionService } from '../../../../../services/shared/authenticacion.service';
import { FirestoreService } from '../../../../../services/shared/firestore.service';
import { Models } from '../../../../../interfaces/models';

@Component({
  selector: 'app-flota-vehiculos',
  standalone: true,
  imports: [CommonModule, RouterLink, DonutComponent],
  templateUrl: './flota-vehiculos.component.html',
  styleUrl: './flota-vehiculos.component.css'
})
export class FlotaVehiculosComponent implements OnInit, OnDestroy {

  private _auth = inject(AuthenticacionService);
  private _firestore = inject(FirestoreService);

  vehiculos: any[] = [];
  cargando = true;

  // Gráfica 1: por tipo de vehículo
  tipoLabels: string[] = [];
  tipoSeries: number[] = [];

  // Gráfica 2: por tipo de relación con la empresa
  relacionLabels: string[] = [];
  relacionSeries: number[] = [];

  // Gráfica 3: plan de mantenimiento preventivo
  mantenimientoLabels: string[] = [];
  mantenimientoSeries: number[] = [];

  // Stats rápidas
  totalVehiculos = 0;
  conMantenimiento = 0;
  conSiniestros = 0;
  promedioKmMes = 0;

  private _sub?: Subscription;

  ngOnInit() {
    const nit = this._auth.getCurrentUser().displayName;
    const periodo = this._auth.periodo();
    const path = `Empresas/${nit}/periodos/${periodo}/006-diagnostico-vehiculos`;
    const q: Models.Firebases.whereQuery[] = [['estado', '==', 'Activo']];

    this._sub = this._firestore
      .getDocumentsQueryChanges<any>(path, q)
      .subscribe(res => {
        this.vehiculos = res;
        this._calcularGraficas(res);
        this.cargando = false;
      });
  }

  private _calcularGraficas(data: any[]) {
    this.totalVehiculos = data.length;

    // Gráfica 1: tipo de vehículo
    const porTipo = this._agrupar(data, 'tipoVehiculo');
    this.tipoLabels = Object.keys(porTipo);
    this.tipoSeries = Object.values(porTipo);

    // Gráfica 2: tipo de relación
    const porRelacion = this._agrupar(data, 'tipoRelacion');
    this.relacionLabels = Object.keys(porRelacion);
    this.relacionSeries = Object.values(porRelacion);

    // Gráfica 3: plan de mantenimiento (SI / NO / Sin definir)
    const porMantenimiento = this._agrupar(data, 'tienePlanMantenimiento');
    this.mantenimientoLabels = Object.keys(porMantenimiento).map(k =>
      k === 'SI' ? 'Con plan' : k === 'NO' ? 'Sin plan' : 'Sin definir'
    );
    this.mantenimientoSeries = Object.values(porMantenimiento);

    // Stats
    this.conMantenimiento = data.filter(v => v.tienePlanMantenimiento === 'SI').length;
    this.conSiniestros    = data.filter(v => v.tieneSiniestros === 'SI').length;
    const kmTotales = data.reduce((s, v) => s + (Number(v.promedioKmMes) || 0), 0);
    this.promedioKmMes = data.length > 0 ? Math.round(kmTotales / data.length) : 0;
  }

  private _agrupar(items: any[], campo: string): Record<string, number> {
    return items.reduce((acc, item) => {
      const key = item[campo] || 'Sin definir';
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  ngOnDestroy() {
    this._sub?.unsubscribe();
  }
}
