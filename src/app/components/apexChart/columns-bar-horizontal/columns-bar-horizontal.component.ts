import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  NgApexchartsModule,
  ApexChart,
  ApexAxisChartSeries,
  ApexXAxis,
  ApexYAxis,
  ApexDataLabels,
  ApexPlotOptions,
  ApexGrid
} from "ng-apexcharts";

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  dataLabels: ApexDataLabels;
  plotOptions: ApexPlotOptions;
  grid: ApexGrid;
  colors: string[];
};

// Definimos una interfaz para la estructura de datos
export interface CauseData {
  causa: string;
  porcentaje: number;
  cantidad?: number;
}

@Component({
  selector: 'app-columns-bar-horizontal',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  template: `
    <div class="w-full max-w-4xl mx-auto p-4">
      @if (nonZeroData.length > 0) {
        <apx-chart
          [series]="chartOptions.series"
          [chart]="chartOptions.chart"
          [xaxis]="chartOptions.xaxis"
          [yaxis]="chartOptions.yaxis"
          [dataLabels]="chartOptions.dataLabels"
          [plotOptions]="chartOptions.plotOptions"
          [grid]="chartOptions.grid"
          [colors]="chartOptions.colors"
        ></apx-chart>
      }
      @if (zeroData.length > 0) {
        <div class="mt-1 space-y-1 px-1">
          @for (item of zeroData; track item.causa) {
            <div class="flex items-center justify-between text-xs text-gray-500 py-1 border-b border-gray-100 last:border-0">
              <span class="truncate pr-2">{{ item.causa }}</span>
              <span class="shrink-0 font-medium text-gray-400">0%</span>
            </div>
          }
        </div>
      }
    </div>
  `
})
export class  ColumnsBarHorizontalComponent implements OnInit {

  // Recibimos los datos como Input
  @Input() data: CauseData[] = [];
  @Input() titulo: string = 'Causas de Accidentes';
  @Input() colorBarra: string = '#0047AB';
  @Input() alturaMinima: number = 180;

  chartOptions!: ChartOptions;

  get nonZeroData() { return this.data.filter(d => d.porcentaje > 0); }
  get zeroData()    { return this.data.filter(d => d.porcentaje === 0); }

  ngOnInit() {
    this.initializeChart();
  }

  private initializeChart() {
    const src = this.nonZeroData;
    const alturaGrafico = Math.max(this.alturaMinima, src.length * 45);

    this.chartOptions = {
      series: [{
        name: 'Porcentaje',
        data: src.map(d => d.porcentaje)
      }],
      chart: {
        type: 'bar',
        height: alturaGrafico,
        width: '100%',
        offsetX: -10, // mueve el grafico hacia la izquierda para dar más espacio a las etiquetas
        toolbar: { show: false },
        animations: { dynamicAnimation: { enabled: false } }
      },
      plotOptions: {
        bar: {
          horizontal: true,
          dataLabels: { position: 'top' },
          borderRadius: 0,
        }
      },
      dataLabels: {
        enabled: true,
        formatter: (val: number) =>
          (val % 1 === 0 ? val.toFixed(0) : val.toFixed(2)) + '%',
        style: { fontSize: '12px' },
        offsetX: 5
      },
      xaxis: {
        categories: src.map(d => d.causa),
        labels: {
          formatter: (val: string) => val + '%'
        }
      },
      yaxis: {
        labels: {
          offsetX: -10,
          align: 'left',
          style: {
            fontSize: '12px'
          },
          maxWidth: 220 // Permite que el texto se divida en múltiples líneas
        }
      },
      grid: {
        xaxis: {
          lines: {
            show: true
          }
        },
        yaxis: {
          lines: {
            show: false
          }
        },
        padding: {
          left: 0,
          right: 0,
          top: -10,
          bottom: -10
        }
      },
      colors: ['#0047AB']  // Color azul para las barras
    };
  }

}
