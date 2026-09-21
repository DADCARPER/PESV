import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  NgApexchartsModule, ApexAxisChartSeries, ApexChart, ApexXAxis, ApexYAxis,
  ApexDataLabels, ApexPlotOptions, ApexTooltip, ApexLegend,
} from 'ng-apexcharts';

/** Una barra: su etiqueta, cuántos y qué parte del total son. */
export interface BarraVertical {
  etiqueta: string;
  total: number;
  porcentaje: number;
}

type Opciones = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  dataLabels: ApexDataLabels;
  plotOptions: ApexPlotOptions;
  tooltip: ApexTooltip;
  legend: ApexLegend;
  colors: string[];
};

/**
 * Barras verticales para el informe.
 *
 * Las que ya había en el proyecto pintan en horizontal, que va bien para
 * etiquetas largas pero no para una escala ordenada como la escolaridad, donde
 * se lee de menor a mayor y la vertical lo dice sola.
 *
 * Muestra el número sobre la barra y el porcentaje en el eje, porque en un
 * informe hacen falta los dos: el dato y su peso.
 */
@Component({
  selector: 'app-barras-verticales',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  template: `
    @if (listo) {
      <apx-chart
        [series]="opciones.series!"
        [chart]="opciones.chart!"
        [xaxis]="opciones.xaxis!"
        [yaxis]="opciones.yaxis!"
        [dataLabels]="opciones.dataLabels!"
        [plotOptions]="opciones.plotOptions!"
        [tooltip]="opciones.tooltip!"
        [legend]="opciones.legend!"
        [colors]="opciones.colors!">
      </apx-chart>
    }
  `,
})
export class BarrasVerticalesComponent implements OnChanges {

  @Input() datos: BarraVertical[] = [];
  @Input() altura = 300;

  listo = false;
  opciones: Partial<Opciones> = {};

  ngOnChanges(): void {
    this.construir();
    this.listo = this.datos.length > 0;
  }

  private construir(): void {
    this.opciones = {
      series: [{ name: 'Personas', data: this.datos.map(d => d.total) }],
      chart: {
        type: 'bar',
        height: this.altura,
        toolbar: { show: false },
        animations: { enabled: false },
        fontFamily: 'inherit',
      },
      plotOptions: {
        bar: { distributed: true, columnWidth: '55%', borderRadius: 4 },
      },
      // Distribuido pone una leyenda por barra, que repite el eje.
      legend: { show: false },
      colors: ['#fbbf24', '#f59e0b', '#e8930a', '#d97706', '#b45309', '#92400e'],
      dataLabels: {
        enabled: true,
        offsetY: -22,
        style: { colors: ['#374151'], fontSize: '12px', fontWeight: 600 },
        formatter: (valor: number) => `${valor}`,
      },
      xaxis: {
        categories: this.datos.map(d => d.etiqueta),
        labels: { style: { fontSize: '11px' }, trim: true, hideOverlappingLabels: false },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: { labels: { style: { fontSize: '11px' } } },
      tooltip: {
        y: {
          formatter: (valor: number, { dataPointIndex }: any) =>
            `${valor} personas · ${this.datos[dataPointIndex]?.porcentaje ?? 0}%`,
        },
      },
    };
  }
}
