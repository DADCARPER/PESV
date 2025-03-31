import { Component, Input } from '@angular/core'; // Agregamos Input
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
  @Input() series: ApexAxisChartSeries = [
    {
      name: "No",
      data: [36]
    },
    {
      name: "Si",
      data: [62]
    }
  ];

  chartOptions: ChartOptions = {
    series: this.series,
    chart: {
      type: 'bar',
      height: 350,
      stacked: true,
      stackType: '100%',
      toolbar: {
        show: false
      },
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
    colors: ['#CCCCCC', '#3f56b6'],
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