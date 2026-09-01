import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { DonutComponent } from '../../../../../components/apexChart/donut/donut.component';
import { PieMonochromeComponent } from '../../../../../components/apexChart/pie-monochrome/pie-monochrome.component';
import { ColumnsStrackedIconosComponent } from '../../../../../components/apexChart/columns-stracked-iconos/columns-stracked-iconos.component';
import { AuthenticacionService } from '../../../../../services/shared/authenticacion.service';
import { FirestoreService } from '../../../../../services/shared/firestore.service';
import { Models } from '../../../../../interfaces/models';

@Component({
  selector: 'app-rutas',
  standalone: true,
  imports: [CommonModule, RouterLink, DonutComponent, PieMonochromeComponent, ColumnsStrackedIconosComponent],
  templateUrl: './rutas.component.html',
  styleUrl: './rutas.component.css'
})
export class RutasComponent implements OnInit, OnDestroy {

  private _auth = inject(AuthenticacionService);
  private _firestore = inject(FirestoreService);

  rutas: any[] = [];
  cargando = true;

  // Gráfica 1: por tipo de vía
  tipoViaLabels: string[] = [];
  tipoViaSeries: number[] = [];

  // Gráfica 2: por frecuencia
  frecuenciaLabels: string[] = [];
  frecuenciaSeries: number[] = [];

  // Gráfica 3: por tiempo estimado
  tiempoLabels: string[] = [];
  tiempoSeries: number[] = [];
  tiempoPctData: number[] = [];


  // Stats rápidas
  totalRutas = 0;
  distanciaPromedio = 0;
  distanciaMaxima = 0;

  private _sub?: Subscription;

  ngOnInit() {
    const nit = this._auth.getCurrentUser().displayName;
    const periodo = this._auth.periodo();
    const path = `Empresas/${nit}/periodos/${periodo}/006-diagnostico-rutas`;
    const q: Models.Firebases.whereQuery[] = [['estado', '==', 'Activo']];

    this._sub = this._firestore
      .getDocumentsQueryChanges<any>(path, q)
      .subscribe(res => {
        this.rutas = res;
        this._calcularGraficas(res);
        this.cargando = false;
      });
  }

  private _calcularGraficas(data: any[]) {
    this.totalRutas = data.length;

    // Gráfica 1: tipo de vía
    const porTipoVia = this._agrupar(data, 'tipoVia');
    this.tipoViaLabels = Object.keys(porTipoVia);
    this.tipoViaSeries = Object.values(porTipoVia);

    // Gráfica 2: frecuencia
    const porFrecuencia = this._agrupar(data, 'frecuencia');
    this.frecuenciaLabels = Object.keys(porFrecuencia);
    this.frecuenciaSeries = Object.values(porFrecuencia);

    // Gráfica 3: tiempo estimado
    const porTiempo = this._agrupar(data, 'tiempoEstimado');
    const tiempoActivos = Object.entries(porTiempo).filter(([, v]) => v > 0);
    this.tiempoLabels  = tiempoActivos.map(([k]) => k);
    this.tiempoSeries  = tiempoActivos.map(([, v]) => v);
    const tiempoTotal  = this.tiempoSeries.reduce((s, v) => s + v, 0);
    this.tiempoPctData = tiempoTotal > 0
      ? this.tiempoSeries.map(v => Math.round((v / tiempoTotal) * 10000) / 100)
      : this.tiempoSeries.map(() => 0);

    // Stats
    const kms = data.map(r => Number(r.distanciaKm) || 0).filter(v => v > 0);
    this.distanciaPromedio = kms.length ? Math.round(kms.reduce((a, b) => a + b, 0) / kms.length) : 0;
    this.distanciaMaxima   = kms.length ? Math.max(...kms) : 0;
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
