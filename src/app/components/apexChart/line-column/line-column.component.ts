import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  NgApexchartsModule,
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexYAxis,
  ApexDataLabels,
  ApexTitleSubtitle,
  ApexStroke,
  ApexGrid,
  ApexLegend,
  ApexTooltip
} from "ng-apexcharts";

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis[];
  title: ApexTitleSubtitle;
  stroke: ApexStroke;
  dataLabels: ApexDataLabels;
  grid: ApexGrid;
  legend: ApexLegend;
  tooltip: ApexTooltip;
};

@Component({
  selector: 'app-line-column',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  template: ` 
    <div [class]="muestraBorde ? 'rounded-lg border border-gray-100 bg-white p-4 hover:shadow-lg transition-shadow duration-200 text-center' : ''" >
      <div class="w-full max-w-4xl mx-auto p-4">
        <apx-chart
          *ngIf="chartOptions"
          [series]="chartOptions.series"
          [chart]="chartOptions.chart"
          [xaxis]="chartOptions.xaxis"
          [yaxis]="chartOptions.yaxis"
          [title]="chartOptions.title"
          [stroke]="chartOptions.stroke"
          [dataLabels]="chartOptions.dataLabels"
          [grid]="chartOptions.grid"
          [legend]="chartOptions.legend"
          [tooltip]="chartOptions.tooltip"
        ></apx-chart>
      </div>
    </div>
  `
})
export class LineColumnComponent implements OnChanges {

  @Input() seriesData1: number[] = [];
  @Input() seriesData2: number[] = [];
  @Input() seriesData3: number[] = [];
  @Input() labels: string[] = [];
  @Input() title: string = '';
  @Input() muestraBorde: boolean = false;

  chartOptions: ChartOptions = {
    series: [
      {
        name: "Femenino",
        type: "column",
        data: this.seriesData1,
        color: '#2661b3',
        
      },
      {
        name: "Total",
        type: "line",
        data: this.seriesData3,
        color: '#1c3f70'
      },
      {
        name: "Masculino",
        type: "column",
        data: this.seriesData2,
        color: '#92b6e7'
      },
    ],
    chart: {
      height: 350,
      type: "line",
      toolbar: {
        show: false,
        tools: {
          download: false,
          selection: false,
          zoom: false,
          zoomin: false,
          zoomout: false,
          pan: false
        }
      },
      zoom: {
        enabled: false
      }
    },
    stroke: {
      width: [0, 4, 0],
      curve: 'smooth'
    },
    title: {
      text: this.title,
      align: 'left'
    },
    dataLabels: {
      enabled: true,  // Activa los dataLabels en todas las series
      formatter: function (val, opts) {
        // Asegúrate de que 'val' es un número antes de formatearlo como porcentaje
        if (typeof val === 'number') {
          if (opts.seriesIndex === 1) {  // Si es la serie "Total" (índice 1)
            return val.toFixed(2) + "%";  // Formato de porcentaje para la serie "Total"
          }
        }
        return val.toString();  // Si no es número, convierte 'val' a cadena
      },
      offsetY: -10
      
    },
    xaxis: {
      categories: this.labels,  // Usamos 'this.labels' aquí para las categorías
      type: 'category',
      labels: {
        show: true,
        rotate: 0,
        style: {
          fontSize: '12px',
        }
      }
    },
    yaxis: [
      {
        title: {
          text: ""
        },
        labels: {
          formatter: function (value) {
            return Math.round(value).toString();  // Elimina los decimales y redondea a números enteros
          }
        }
      },
      {
        opposite: true,
        title: {
          text: ""
        },
        labels: {
          formatter: function (value) {
            return value + "%";  // Agregar % solo al eje Y derecho
          }
        }
      }
    ],
    legend: {
      position: 'bottom',
      horizontalAlign: 'center',
    },
    grid: {
      borderColor: '#e7e7e7',
      row: {
        colors: ['#f3f3f3', 'transparent'],
        opacity: 0.5
      }
    },
    tooltip: {
      shared: false,
    }
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['seriesData1'] || changes['seriesData2'] || changes['seriesData3'] || changes['labels'] || changes['title']) {
      // Actualizar las opciones del gráfico si los inputs cambian
      this.chartOptions.series[0].data = this.seriesData1;
      this.chartOptions.series[1].data = this.seriesData2;
      this.chartOptions.series[2].data = this.seriesData3;
      this.chartOptions.title.text = this.title;
      this.chartOptions.xaxis.categories = this.labels;  // Asegura que las categorías se actualicen correctamente
    }
  }
}
