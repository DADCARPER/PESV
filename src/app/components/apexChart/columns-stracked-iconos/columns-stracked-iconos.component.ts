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
export class ColumnsStrackedIconosComponent {
  @Input() data: number[] = [];
  @Input() categories: string[] = [];
  @Input() anchoColumna: number = 100;
  @Input() espacioslinea: number = 5;
  

  public chartOptions: ChartOptions;

  constructor() {
    this.chartOptions = this.initializeChartOptions();
  }

  ngOnInit(): void {
    this.updateChartOptions();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] || changes['categories'] || changes['anchoColumna']) {
      this.updateChartOptions();
    }
  }

  private initializeChartOptions(): ChartOptions {
    return {
      series: [{
        name: 'Porcentaje',
        data: []
      }],
      chart: {
        type: 'bar',
        height: 300,
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
      colors: ['#0047AB'],
      plotOptions: {
        bar: {
          borderRadius: 0,
          columnWidth: '40%',
          dataLabels: {
            position: 'top'
          }
        }
      },
      dataLabels: {
        enabled: true,
        formatter: function(val: any) {
          if (typeof val === 'number') {
            return val.toFixed(2) + "%";
          }
          return val + "%";
        },
        offsetY: -20,
        style: {
          fontSize: '12px',
          fontWeight: 'bold'
        }
      },
      xaxis: {
        categories: [],
        position: 'bottom',
        labels: {
          style: {
            fontSize: '12px'
          }
        }
      },
      yaxis: {
        labels: {
          formatter: function (val) {
            return val.toFixed(2) + '%';
          }
        },
        max: 100,
        tickAmount: 4
      },
      grid: {
        borderColor: '#f1f1f1',
        xaxis: {
          lines: {
            show: true
          }
        },
        yaxis: {
          lines: {
            show: true
          }
        }
      }
    };
  }

  private updateChartOptions(): void {
    this.chartOptions.series = [{
      name: 'Porcentaje',
      data: this.data
    }];
    this.chartOptions.xaxis.categories = this.categories;
    this.chartOptions.yaxis.max = this.anchoColumna;
    this.chartOptions.yaxis.tickAmount = this.espacioslinea;
  }
}