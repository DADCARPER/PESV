import { Component } from '@angular/core';
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

  chartOptions: ChartOptions = {
    series: [{
      name: 'Porcentaje',
      data: [1.02, 3.06, 22.45, 40.82, 32.65]
    }],
    chart: {
      type: 'bar',
      height: 400,
      toolbar: {
        show: false
      }
    },
    colors: ['#0047AB'], // Azul similar al de la imagen
    plotOptions: {
      bar: {
        borderRadius: 0,
        columnWidth: '50%',
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
      categories: ['A pie 🚶', 'Bicicleta 🚲', 'Automóvil 🚗', 'Motocicleta 🏍️', 'Transporte público 🚌'],
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
      max: 50, // Para que el gráfico tenga un máximo de 50%
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
