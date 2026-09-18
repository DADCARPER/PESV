import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DonutComponent } from '../../../../../components/apexChart/donut/donut.component';
import { PieMonochromeComponent } from '../../../../../components/apexChart/pie-monochrome/pie-monochrome.component';
import { ColumnsStrackedIconosComponent } from '../../../../../components/apexChart/columns-stracked-iconos/columns-stracked-iconos.component';
import { AuthenticacionService } from '../../../../../services/shared/authenticacion.service';
import { DiagnosticoDatosService } from '../../../../../services/shared/diagnostico-datos.service';
import { Models } from '../../../../../interfaces/models';

@Component({
  selector: 'app-rutas',
  standalone: true,
  imports: [CommonModule, RouterLink, DonutComponent, PieMonochromeComponent, ColumnsStrackedIconosComponent],
  templateUrl: './rutas.component.html',
  styleUrl: './rutas.component.css'
})
export class RutasComponent implements OnInit {

  private _auth = inject(AuthenticacionService);
  private _datos = inject(DiagnosticoDatosService);

  rutas: any[] = [];
  cargando = true;

  /** Por que no se pudieron leer los datos. Vacio si todo fue bien. */
  error = '';

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


  async ngOnInit() {
    // Se espera a que Firebase resuelva la sesion: en una recarga en frio
    // todavia no hay NIT y la ruta de la consulta saldria mal formada.
    if (!await this._auth.waitForUser()) return;
    try {
      const datos = await this._datos.todos<any>('rutas');
      this.rutas = datos;
      this._calcularGraficas(datos);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'No se pudieron cargar los datos';
      console.error('[Rutas] cargar:', error);
      this.error = msg;
    } finally {
      this.cargando = false;
    }
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

}
