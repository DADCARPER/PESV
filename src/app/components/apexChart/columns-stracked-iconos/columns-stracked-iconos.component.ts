import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  NgApexchartsModule,
  ApexChart,
  ApexAxisChartSeries,
  ApexXAxis,
  ApexYAxis,
  ApexDataLabels,
  ApexGrid,
  ApexPlotOptions
} from "ng-apexcharts";

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  dataLabels: ApexDataLabels;
  grid: ApexGrid;
  plotOptions: ApexPlotOptions;
  colors: string[];
};

@Component({
  selector: 'app-columns-stracked-iconos',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  template: `
    <div class="w-full max-w-4xl mx-auto p-4">
      <apx-chart
        [series]="chartOptions.series"
        [chart]="chartOptions.chart"
        [xaxis]="chartOptions.xaxis"
        [yaxis]="chartOptions.yaxis"
        [dataLabels]="chartOptions.dataLabels"
        [grid]="chartOptions.grid"
        [plotOptions]="chartOptions.plotOptions"
        [colors]="chartOptions.colors"
      ></apx-chart>
    </div>
  `
})
export class ColumnsStrackedIconosComponent implements OnInit, OnChanges {

  @Input() data: number[] = [];
  @Input() categories: string[] = [];
  @Input() anchoColumna: number = 100;
  @Input() espacioslinea: number = 5;
  /** Emoji o texto corto por cada barra, en el mismo orden que categories */
  @Input() iconos: string[] = [];

  public chartOptions: ChartOptions;

  constructor() {
    this.chartOptions = this.initializeChartOptions();
  }

  ngOnInit(): void {
    this.updateChartOptions();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] || changes['categories'] || changes['anchoColumna'] || changes['espacioslinea'] || changes['iconos']) {
      this.updateChartOptions();
    }
  }

  private formatPct(val: number): string {
    return Number.isInteger(val) ? `${val}%` : `${val.toFixed(2)}%`;
  }

  private initializeChartOptions(): ChartOptions {
    return {
      series: [{ name: 'Porcentaje', data: [] }],
      chart: {
        type: 'bar',
        height: 300,
        toolbar: { show: false },
        animations: { dynamicAnimation: { enabled: false } },
        defaultLocale: 'es',
        locales: [{
          name: 'es',
          options: {
            toolbar: {
              exportToSVG: 'Descargar SVG',
              exportToPNG: 'Descargar PNG',
              menu: 'Menu'
            }
          }
        }]
      },
      colors: ['#0047AB'],
      plotOptions: {
        bar: {
          borderRadius: 0,
          columnWidth: '40%',
          dataLabels: { position: 'top' }
        }
      },
      dataLabels: {
        enabled: true,
        formatter: (val: any) => typeof val === 'number' ? this.formatPct(val) : val + '%',
        offsetY: 0,
        style: { fontSize: '12px', fontWeight: 'bold', colors: ['#fff'] },
        background: {
          enabled: true,
          foreColor: '#1e3a5f',
          padding: 4,
          borderRadius: 2,
          borderWidth: 0,
          opacity: 0.85
        }
      },
      xaxis: {
        categories: [],
        position: 'bottom',
        labels: { style: { fontSize: '12px' } }
      },
      yaxis: {
        labels: { formatter: (val) => this.formatPct(val) },
        max: 100,
        tickAmount: 4
      },
      grid: {
        borderColor: '#f1f1f1',
        xaxis: { lines: { show: true } },
        yaxis: { lines: { show: true } }
      }
    };
  }

  private updateChartOptions(): void {
    const base = this.initializeChartOptions();
    const tieneIconos = this.iconos.length > 0;

    this.chartOptions = {
      ...base,
      series: [{ name: 'Porcentaje', data: this.data }],
      xaxis: { ...base.xaxis, categories: this.categories },
      yaxis: {
        ...(base.yaxis as object),
        max: this.anchoColumna,
        tickAmount: this.espacioslinea
      },
      chart: {
        ...base.chart,
        // Más altura si hay iconos para que quepan sobre las barras
        height: tieneIconos ? 340 : 300
      },
      dataLabels: {
        ...base.dataLabels,
        formatter: (val: any, opts: any) => {
          const pct = typeof val === 'number' ? this.formatPct(val) : val + '%';
          if (tieneIconos) {
            const icono = this.iconos[opts?.dataPointIndex] ?? '';
            return icono ? [icono, pct] : pct;
          }
          return pct;
        },
        offsetY: tieneIconos ? -10 : 0,
        style: {
          fontSize: tieneIconos ? '16px' : '12px',
          fontWeight: 'bold',
          colors: ['#fff']
        }
      }
    };
  }
}
