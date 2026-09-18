import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DonutComponent } from '../../../../../components/apexChart/donut/donut.component';
import { ColumnsStrackedNumericoComponent } from '../../../../../components/apexChart/columns-stracked-numerico/columns-stracked-numerico.component';
import { ColumnsStrackedIconosComponent } from '../../../../../components/apexChart/columns-stracked-iconos/columns-stracked-iconos.component';
import { AuthenticacionService } from '../../../../../services/shared/authenticacion.service';
import { DiagnosticoDatosService } from '../../../../../services/shared/diagnostico-datos.service';
import { Models } from '../../../../../interfaces/models';

@Component({
  selector: 'app-flota-vehiculos',
  standalone: true,
  imports: [CommonModule, RouterLink, DonutComponent, ColumnsStrackedNumericoComponent, ColumnsStrackedIconosComponent],
  templateUrl: './flota-vehiculos.component.html',
  styleUrl: './flota-vehiculos.component.css'
})
export class FlotaVehiculosComponent implements OnInit {

  private _auth = inject(AuthenticacionService);
  private _datos = inject(DiagnosticoDatosService);

  vehiculos: any[] = [];
  cargando = true;

  /** Por que no se pudieron leer los datos. Vacio si todo fue bien. */
  error = '';

  // Gráfica 1: por tipo de vehículo
  tipoLabels: string[] = [];
  tipoSeries: number[] = [];

  // Gráfica 2: por tipo de relación con la empresa
  relacionLabels: string[] = [];
  relacionSeries: number[] = [];

  // Gráfica 3: plan de mantenimiento preventivo
  mantenimientoLabels: string[] = [];
  mantenimientoSeries: number[] = [];

  // Gráfica tipo vehículo (pre-calculados para evitar re-animación)
  tipoPctData: number[] = [];

  // Gráfica 4: siniestros viales
  siniestrosLabels: string[] = [];
  siniestrosSeries: number[] = [];

  // Stats rápidas
  totalVehiculos = 0;
  conMantenimiento = 0;
  conSiniestros = 0;
  promedioKmMes = 0;


  async ngOnInit() {
    // Se espera a que Firebase resuelva la sesion: en una recarga en frio
    // todavia no hay NIT y la ruta de la consulta saldria mal formada.
    if (!await this._auth.waitForUser()) return;
    try {
      const datos = await this._datos.todos<any>('vehiculos');
      this.vehiculos = datos;
      this._calcularGraficas(datos);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'No se pudieron cargar los datos';
      console.error('[FlotaVehiculos] cargar:', error);
      this.error = msg;
    } finally {
      this.cargando = false;
    }
  }

  private _calcularGraficas(data: any[]) {
    this.totalVehiculos = data.length;

    // Gráfica 1: tipo de vehículo
    const porTipo = this._agrupar(data, 'tipoVehiculo');
    this.tipoLabels = Object.keys(porTipo);
    this.tipoSeries = Object.values(porTipo);
    const tipoTotal = this.tipoSeries.reduce((s, v) => s + v, 0);
    this.tipoPctData = tipoTotal > 0
      ? this.tipoSeries.map(v => Math.round((v / tipoTotal) * 10000) / 100)
      : this.tipoSeries.map(() => 0);

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

    // Gráfica 4: siniestros viales
    const si  = data.filter(v => v.tieneSiniestros === 'SI').length;
    const no  = data.filter(v => v.tieneSiniestros === 'NO').length;
    this.siniestrosLabels = ['Con siniestros', 'Sin siniestros'];
    this.siniestrosSeries = [si, no];

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

  private static readonly ICONO_VEHICULO: Record<string, string> = {
    'automóvil': '🚗', 'automovil': '🚗', 'carro': '🚗', 'auto': '🚗',
    'camioneta': '🚙', 'suv': '🚙',
    'camión': '🚛', 'camion': '🚛', 'tractocamión': '🚛', 'tractocamion': '🚛',
    'bus': '🚌', 'buseta': '🚌', 'microbus': '🚌', 'microbús': '🚌',
    'motocicleta': '🏍️', 'moto': '🏍️', 'motocarro': '🏍️',
    'bicicleta': '🚲', 'bici': '🚲',
    'van': '🚐', 'furgón': '🚐', 'furgon': '🚐',
    'volqueta': '🚚', 'volquete': '🚚',
  };


}
