import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { DonutComponent } from '../../../../../components/apexChart/donut/donut.component';
import { AuthenticacionService } from '../../../../../services/shared/authenticacion.service';
import { FirestoreService } from '../../../../../services/shared/firestore.service';
import { Models } from '../../../../../interfaces/models';

@Component({
  selector: 'app-rutas',
  standalone: true,
  imports: [CommonModule, RouterLink, DonutComponent],
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

  // Gráfica 3: por rango de distancia
  distanciaLabels: string[] = [];
  distanciaSeries: number[] = [];

  // Stats rápidas
  totalRutas = 0;
  distanciaPromedio = 0;
  tiempoPromedio = 0;
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

    // Gráfica 3: rango de distancia en km
    const rangos: Record<string, number> = {
      '0 – 50 km': 0,
      '51 – 150 km': 0,
      '151 – 300 km': 0,
      'Más de 300 km': 0,
      'Sin registrar': 0,
    };
    for (const r of data) {
      const km = Number(r.distanciaKm) || 0;
      if (!r.distanciaKm && km === 0) rangos['Sin registrar']++;
      else if (km <= 50)  rangos['0 – 50 km']++;
      else if (km <= 150) rangos['51 – 150 km']++;
      else if (km <= 300) rangos['151 – 300 km']++;
      else                rangos['Más de 300 km']++;
    }
    // Filtrar rangos con 0 para no mostrar segmentos vacíos
    const rangosActivos = Object.entries(rangos).filter(([, v]) => v > 0);
    this.distanciaLabels = rangosActivos.map(([k]) => k);
    this.distanciaSeries = rangosActivos.map(([, v]) => v);

    // Stats
    const kms    = data.map(r => Number(r.distanciaKm)   || 0).filter(v => v > 0);
    const minuts = data.map(r => Number(r.tiempoMinutos) || 0).filter(v => v > 0);
    this.distanciaPromedio = kms.length    ? Math.round(kms.reduce((a, b) => a + b, 0)    / kms.length)    : 0;
    this.tiempoPromedio    = minuts.length ? Math.round(minuts.reduce((a, b) => a + b, 0) / minuts.length) : 0;
    this.distanciaMaxima   = kms.length    ? Math.max(...kms) : 0;
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
