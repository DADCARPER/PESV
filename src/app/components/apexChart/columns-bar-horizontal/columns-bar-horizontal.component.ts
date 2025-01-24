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
}

@Component({
  selector: 'app-columns-bar-horizontal',
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
        [plotOptions]="chartOptions.plotOptions"
        [grid]="chartOptions.grid"
        [colors]="chartOptions.colors"
      ></apx-chart>
    </div>
  `
})
export class ColumnsBarHorizontalComponent implements OnInit {

  // Recibimos los datos como Input
  @Input() data: CauseData[] = [];
  @Input() titulo: string = 'Causas de Accidentes';
  @Input() colorBarra: string = '#0047AB';

  chartOptions!: ChartOptions;

  ngOnInit() {
    this.initializeChart();
  }

  private initializeChart() {
    this.chartOptions = {
      series: [{
        name: 'Porcentaje',
        data: this.data.map(d=>d.porcentaje)  // Usamos los porcentajes como datos
      }],
      chart: {
        type: 'bar',
        height: 350,
        toolbar: {
          show: false
        }
      },
      plotOptions: {
        bar: {
          horizontal: true,
          dataLabels: {
            position: 'center'
          },
          borderRadius: 0,
          barHeight: '70%'
        }
      },
      dataLabels: {
        enabled: true,
        formatter: function(val: number) {
          return val.toFixed(2) + '%';
        },
        style: {
          fontSize: '12px'
        },
        offsetX: 5
      },
      xaxis: {
        categories: this.data.map(d=>d.causa),  // Usamos las causas como categorías
        labels: {
          formatter: function(val: string) {
            return val + '%';
          }
        }
      },
      yaxis: {
        labels: {
          style: {
            fontSize: '12px'
          },
          maxWidth: 300 // Permite que el texto se divida en múltiples líneas
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
        }
      },
      colors: ['#0047AB']  // Color azul para las barras
    };
  }

}
