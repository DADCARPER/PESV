import { Component } from '@angular/core';
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
  labels: string[];
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
    <div class="w-full max-w-4xl mx-auto p-4">
      <apx-chart
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
  `
})
export class LineColumnComponent {

  chartOptions: ChartOptions = {
    series: [
      {
        name: "Ventas",
        type: "column",
        data: [23, 11, 22, 27, 13, 22, 37, 21, 44, 22, 30, 21]
      },
      {
        name: "Ingresos",
        type: "line",
        data: [44, 55, 41, 67, 22, 43, 21, 41, 56, 27, 43, 27]
      }
    ],
    labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
    chart: {
      height: 350,
      type: "line",
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: true,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: true
        }
      }
    },
    stroke: {
      width: [0, 4],
      curve: 'smooth'
    },
    title: {
      text: "Ventas e Ingresos Mensuales",
      align: 'left'
    },
    dataLabels: {
      enabled: true,
      enabledOnSeries: [1]
    },
    xaxis: {
      categories: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    },
    yaxis: [
      {
        title: {
          text: "Ventas"
        }
      },
      {
        opposite: true,
        title: {
          text: "Ingresos"
        }
      }
    ],
    legend: {
      position: 'bottom',
      horizontalAlign: 'center'
    },
    grid: {
      borderColor: '#e7e7e7',
      row: {
        colors: ['#f3f3f3', 'transparent'],
        opacity: 0.5
      }
    },
    tooltip: {
      shared: true,
      intersect: false,
      y: {
        formatter: function (y) {
          if(typeof y !== "undefined") {
            return y.toFixed(0) + " unidades";
          }
          return y;
        }
      }
    }
  };
  
}
