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
  ApexLegend
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
};

@Component({
  selector: 'app-columns-stracked',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  template: `
    <div class="w-full max-w-lg mx-auto p-4">
      <apx-chart
        [series]="chartOptions.series"
        [chart]="chartOptions.chart"
        [plotOptions]="chartOptions.plotOptions"
        [xaxis]="chartOptions.xaxis"
        [yaxis]="chartOptions.yaxis"
        [dataLabels]="chartOptions.dataLabels"
        [colors]="chartOptions.colors"
        [legend]="chartOptions.legend"
      ></apx-chart>
    </div>
  `
})
export class ColumnsStrackedComponent {

  chartOptions: ChartOptions = {
    series: [
      {
        name: "No",
        data: [30]
      },
      {
        name: "Si",
        data: [68]
      }
    ],
    chart: {
      type: 'bar',
      height: 350,
      stacked: true,
      stackType: '100%',
      toolbar: {
        show: false
      }
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '55%',
      },
    },
    dataLabels: {
      enabled: true,
      formatter: function(val) {
        return val + "%";
      },
      style: {
        fontSize: '14px',
        fontWeight: 'bold'
      }
    },
    colors: ['#CCCCCC', '#0066CC'], // Gris para "No", Azul para "Si"
    xaxis: {
      categories: [''],
      labels: {
        show: false
      }
    },
    yaxis: {
      max: 100,
      labels: {
        formatter: function(val) {
          return val + "%";
        }
      }
    },
    legend: {
      position: 'bottom',
      horizontalAlign: 'center'
    }
  };

}
