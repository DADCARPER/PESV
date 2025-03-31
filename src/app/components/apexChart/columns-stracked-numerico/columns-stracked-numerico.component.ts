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
  selector: 'app-columns-stracked-numerico',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  templateUrl: './columns-stracked-numerico.component.html',
  styleUrl: './columns-stracked-numerico.component.css'
})
export class ColumnsStrackedNumericoComponent {

  @Input() data: number[] = [];
  @Input() categories: string[] = [];
  @Input() anchoColumna: number = 100;
  

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
            return val.toFixed(0);
          }
          return val;
        },
        offsetY: 50,
        style: {
          fontSize: '12px',
          fontWeight: 'bold',
          colors: ['#fff']
        },
        background: {
          enabled: true,
          foreColor: '#000',
          padding: 6,
          borderRadius: 2,
          borderWidth: 1,
          borderColor: '#fff',
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
            return val.toFixed(0);
          }
        },
        max: 100,
        tickAmount: 5
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
  }

}
