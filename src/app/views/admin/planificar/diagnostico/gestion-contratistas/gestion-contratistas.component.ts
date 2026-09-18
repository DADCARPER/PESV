import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DonutComponent } from '../../../../../components/apexChart/donut/donut.component';
import { ColumnsStrackedComponent } from '../../../../../components/apexChart/columns-stracked/columns-stracked.component';
import { ColumnsBarHorizontalComponent, CauseData } from '../../../../../components/apexChart/columns-bar-horizontal/columns-bar-horizontal.component';
import { ApexAxisChartSeries } from 'ng-apexcharts';
import { AuthenticacionService } from '../../../../../services/shared/authenticacion.service';
import { DiagnosticoDatosService } from '../../../../../services/shared/diagnostico-datos.service';
import { Models } from '../../../../../interfaces/models';

@Component({
  selector: 'app-gestion-contratistas',
  standalone: true,
  imports: [CommonModule, RouterLink, DonutComponent, ColumnsStrackedComponent, ColumnsBarHorizontalComponent],
  templateUrl: './gestion-contratistas.component.html',
  styleUrl: './gestion-contratistas.component.css'
})
export class GestionContratistasComponent implements OnInit {

  private _auth = inject(AuthenticacionService);
  private _datos = inject(DiagnosticoDatosService);

  contratistas: any[] = [];
  cargando = true;

  /** Por que no se pudieron leer los datos. Vacio si todo fue bien. */
  error = '';

  // Gráfica 1: por tipo de vinculación
  vinculacionLabels: string[] = [];
  vinculacionSeries: number[] = [];

  // Gráfica 2: por tipo de persona (Natural / Jurídica)
  personaLabels: string[] = [];
  personaSeries: number[] = [];

  // Gráfica 3: realizan desplazamientos (SI / NO)
  desplazamientoLabels: string[] = [];
  desplazamientoSeries: number[] = [];

  // Stats rápidas
  totalConductores = 0;
  totalVehiculos = 0;
  conDesplazamientos = 0;

  async ngOnInit() {
    // Se espera a que Firebase resuelva la sesion: en una recarga en frio
    // todavia no hay NIT y la ruta saldria mal formada.
    if (!await this._auth.waitForUser()) return;
    try {
      const datos = await this._datos.todos<any>('contratistas');
      this.contratistas = datos;
      this._calcularGraficas(datos);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'No se pudieron cargar los datos';
      console.error('[GestionContratistas] cargar:', error);
      this.error = msg;
    } finally {
      this.cargando = false;
    }
  }

  private _calcularGraficas(data: any[]) {
    // Gráfica 1: tipo de vinculación
    const porVinculacion = this._agrupar(data, 'tipoVinculacion');
    this.vinculacionLabels = Object.keys(porVinculacion);
    this.vinculacionSeries = Object.values(porVinculacion);

    // Gráfica 2: tipo de persona
    const porPersona = this._agrupar(data, 'tipoPersona');
    this.personaLabels = Object.keys(porPersona);
    this.personaSeries = Object.values(porPersona);

    // Gráfica 3: realizan desplazamientos
    const porDesplazamiento = this._agrupar(data, 'realizaDesplazamientos');
    // Normalizar keys: 'SI' → 'Con desplazamientos', 'NO' → 'Sin desplazamientos'
    this.desplazamientoLabels = Object.keys(porDesplazamiento).map(k =>
      k === 'SI' ? 'Con desplazamientos' : k === 'NO' ? 'Sin desplazamientos' : k
    );
    this.desplazamientoSeries = Object.values(porDesplazamiento);

    // Stats
    this.totalConductores = data.reduce((s, c) => s + (Number(c.conductores) || 0), 0);
    this.totalVehiculos   = data.reduce((s, c) => s + (Number(c.vehiculos)   || 0), 0);
    this.conDesplazamientos = data.filter(c => c.realizaDesplazamientos === 'SI').length;
  }

  get vinculacionData(): CauseData[] {
    const total = this.vinculacionSeries.reduce((s, v) => s + v, 0);
    return this.vinculacionLabels.map((label, i) => ({
      causa: label,
      porcentaje: total > 0 ? Math.round((this.vinculacionSeries[i] / total) * 1000) / 10 : 0
    }));
  }

  get personaSeriesStracked(): ApexAxisChartSeries {
    return this.personaLabels.map((label, i) => ({
      name: label,
      data: [this.personaSeries[i] ?? 0]
    }));
  }

  private _agrupar(items: any[], campo: string): Record<string, number> {
    return items.reduce((acc, item) => {
      const key = item[campo] || 'Sin definir';
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

}
