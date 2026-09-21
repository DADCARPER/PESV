import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  NgApexchartsModule, ApexAxisChartSeries, ApexChart, ApexXAxis, ApexYAxis,
  ApexDataLabels, ApexPlotOptions, ApexTooltip, ApexLegend,
} from 'ng-apexcharts';

/** Una barra: su etiqueta, cuántos y qué parte del total son. */
export interface BarraInforme {
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
 * Barras del informe, en vertical o en horizontal.
 *
 * Las que ya había en el proyecto pintan siempre horizontal y meten la
 * etiqueta dentro de la barra, que va bien para un tablero pero no para un
 * informe, donde hace falta ver el número exacto junto a su peso.
 *
 * La orientación no es decorativa: una escala que se lee en orden, como la
 * escolaridad, se entiende mejor en vertical; una lista de categorías sueltas
 * con nombres largos, como el estado civil, se lee mejor en horizontal.
 */
@Component({
  selector: 'app-barras-informe',
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
export class BarrasInformeComponent implements OnChanges {

  @Input() datos: BarraInforme[] = [];
  @Input() altura = 300;
  /** Horizontal cuando las etiquetas son largas o no hay orden natural. */
  @Input() horizontal = false;

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
        bar: {
          distributed: true,
          horizontal: this.horizontal,
          columnWidth: '55%',
          barHeight: '65%',
          borderRadius: 4,
        },
      },
      // Distribuido pone una leyenda por barra, que repite el eje.
      legend: { show: false },
      colors: ['#fbbf24', '#f59e0b', '#e8930a', '#d97706', '#b45309', '#92400e'],
      dataLabels: {
        enabled: true,
        // En vertical la cifra va encima de la barra; en horizontal, dentro,
        // que es donde hay sitio.
        offsetY: this.horizontal ? 0 : -22,
        style: {
          colors: [this.horizontal ? '#fff' : '#374151'],
          fontSize: '12px',
          fontWeight: 600,
        },
        formatter: (valor: number, { dataPointIndex }: any) =>
          this.horizontal
            ? `${valor} · ${this.datos[dataPointIndex]?.porcentaje ?? 0}%`
            : `${valor}`,
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
