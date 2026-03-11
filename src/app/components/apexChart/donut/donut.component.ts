import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
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
  <div [class]="muestraBorde ? 'rounded-lg border border-gray-100 bg-white p-4 hover:shadow-lg transition-shadow duration-200 text-center' : ''">
    <p>{{titulo}}</p>
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
  </div>
  `
})
export class DonutComponent implements OnChanges {

  @Input() labels: string[] = [];
  @Input() series: number[] = [];
  @Input() muestraBorde: boolean = true;
  @Input() titulo: string = '';

  chartOptions: ChartOptions = {
    series: [],
    chart: {
      type: "donut",
      height: 287
    },
    labels: [],
    plotOptions: {
      pie: {
        donut: {
          size: '54%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total',
              formatter: (w) => {
                // Suma de los conteos reales → número entero sin símbolo %
                const total = w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0);
                return total.toString();
              }
            }
          }
        }
      }
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number, opts: any) => {
        // val = porcentaje calculado por ApexCharts (0-100)
        // series[i] = conteo real del segmento
        const count = opts.w.config.series[opts.seriesIndex];
        return `${count} (${val.toFixed(1)}%)`;
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
    colors: ['#5892d8', '#3374c4', '#2661b3', '#1e4886', '#1c3f70', '#1d375d']
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['labels'] || changes['series']) {
      this.chartOptions.labels = this.labels;
      this.chartOptions.series = this.series;
    }
  }

}
