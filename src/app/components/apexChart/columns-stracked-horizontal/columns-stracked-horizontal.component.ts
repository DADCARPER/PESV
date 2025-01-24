import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  NgApexchartsModule,
  ApexChart,
  ApexPlotOptions,
  ApexAxisChartSeries,
  ApexXAxis,
  ApexYAxis,
  ApexDataLabels,
  ApexLegend,
  ApexTooltip
} from "ng-apexcharts";

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  plotOptions: ApexPlotOptions;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  dataLabels: ApexDataLabels;
  colors: string[];
  legend: ApexLegend;
  tooltip: ApexTooltip;
};

@Component({
  selector: 'app-columns-stracked-horizontal',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  template: `
    <div class="w-full max-w-4xl mx-auto p-4">
      <apx-chart
        [series]="chartOptions.series"
        [chart]="chartOptions.chart"
        [plotOptions]="chartOptions.plotOptions"
        [xaxis]="chartOptions.xaxis"
        [yaxis]="chartOptions.yaxis"
        [dataLabels]="chartOptions.dataLabels"
        [colors]="chartOptions.colors"
        [legend]="chartOptions.legend"
        [tooltip]="chartOptions.tooltip"
      ></apx-chart>
    </div>
  `
})
export class ColumnsStrackedHorizontalComponent {

  chartOptions: ChartOptions = {
    series: [
      {
        name: "Menos de 1 hora",
        data: [22.22]
      },
      {
        name: "Entre 1 a 2 horas",
        data: [18.52]
      },
      {
        name: "Entre 2 a 3 horas",
        data: [25.93]
      },
      {
        name: "Entre 3 a 4 horas",
        data: [22.22]
      },
      {
        name: "Más de 6 horas",
        data: [11.11]
      }
    ],
    chart: {
      type: 'bar',
      height: 150,
      stacked: true,
      stackType: '100%',
      toolbar: {
        show: false
      }
    },
    plotOptions: {
      bar: {
        horizontal: true,
      },
    },
    dataLabels: {
      enabled: true,
      formatter: function(val: any) {
        if (typeof val === 'number') {
          return val.toFixed(2) + "%";
        }
        return val + "%";
      },
      style: {
        fontSize: '12px',
        colors: ["#fff"]
      }
    },
    colors: ['#000080', '#0000CD', '#0080FF', '#4169E1', '#00BFFF'],
    xaxis: {
      categories: [''],
      labels: {
        show: true,
        formatter: function(val) {
          return val + "%";
        }
      }
    },
    yaxis: {
      labels: {
        show: false
      }
    },
    legend: {
      position: 'bottom',
      horizontalAlign: 'left'
    },
    tooltip: {
      y: {
        formatter: function(val) {
          return val + "%";
        }
      }
    }
  };
  
}
