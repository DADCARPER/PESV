import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  NgApexchartsModule,
  ApexNonAxisChartSeries,
  ApexChart,
  ApexPlotOptions,
  ApexLegend,
  ApexDataLabels,
  ApexResponsive
} from "ng-apexcharts";

export type ChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  labels: string[];
  plotOptions: ApexPlotOptions;
  legend: ApexLegend;
  dataLabels: ApexDataLabels;
  responsive: ApexResponsive[];
  colors: string[];
};

@Component({
  selector: 'app-donut',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  template: `
    <div class="w-full max-w-2xl mx-auto p-4">
      <apx-chart
        [series]="chartOptions.series"
        [chart]="chartOptions.chart"
        [labels]="chartOptions.labels"
        [plotOptions]="chartOptions.plotOptions"
        [legend]="chartOptions.legend"
        [dataLabels]="chartOptions.dataLabels"
        [responsive]="chartOptions.responsive"
        [colors]="chartOptions.colors"
      ></apx-chart>
    </div>
  `
})
export class DonutComponent {

  chartOptions: ChartOptions = {
    series: [25, 15, 20, 18, 12, 10], // Porcentajes por estrato
    chart: {
      type: "donut",
      height: 380
    },
    labels: ["Estrato 1", "Estrato 2", "Estrato 3", "Estrato 4", "Estrato 5", "Estrato 6"],
    plotOptions: {
      pie: {
        donut: {
          size: '65%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total',
              formatter: function (w) {
                return w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0) + ' %';
              }
            }
          }
        }
      }
    },
    dataLabels: {
      enabled: true,
      formatter: function (val, opts) {
        return opts.w.config.series[opts.seriesIndex] + '%';
      }
    },
    legend: {
      position: 'bottom',
      horizontalAlign: 'center',
      labels: {
        colors: undefined,
        useSeriesColors: false
      },
      markers: {
        strokeWidth: 0
      },
      itemMargin: {
        horizontal: 5,
        vertical: 8
      }
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: {
            width: 320
          },
          legend: {
            position: 'bottom'
          }
        }
      }
    ],
    colors: ['#008FFB', '#00E396', '#FEB019', '#FF4560', '#775DD0', '#546E7A']
  };

}
