import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  NgApexchartsModule,
  ApexNonAxisChartSeries,
  ApexChart,
  ApexPlotOptions,
  ApexLegend,
  ApexDataLabels,
  ApexTheme
} from "ng-apexcharts";

export type ChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  labels: string[];
  plotOptions: ApexPlotOptions;
  legend: ApexLegend;
  dataLabels: ApexDataLabels;
  colors: string[];
};

@Component({
  selector: 'app-pie-monochrome',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  template: `
    <div class="w-full max-w-lg mx-auto p-4">
      <apx-chart
        [series]="chartOptions.series"
        [chart]="chartOptions.chart"
        [labels]="chartOptions.labels"
        [colors]="chartOptions.colors"
        [plotOptions]="chartOptions.plotOptions"
        [legend]="chartOptions.legend"
        [dataLabels]="chartOptions.dataLabels"
      ></apx-chart>
    </div>
  `
})
export class PieMonochromeComponent implements OnChanges {
  @Input() values: number[] = [];
  @Input() labels: string[] = [];

  ngOnChanges(changes: SimpleChanges) {
    if (changes['values']) {
      this.chartOptions.series = changes['values'].currentValue;
    }
    if (changes['labels']) {
      this.chartOptions.labels = changes['labels'].currentValue;
    }
  }

  chartOptions: ChartOptions = {
    series: [], 
    chart: {
      type: "pie",
      height: 360,
      animations: {
        enabled: true,
        speed: 400,
        animateGradually: {
          enabled: true,
          delay: 150
        }
      }
    },
    colors: ['#5892d8', '#3374c4', '#2661b3', '#1e4886', '#1c3f70', '#1d375d'],
    labels: [],
    plotOptions: {
      pie: {
        startAngle: 0,
        endAngle: 360,
        expandOnClick: false,
        offsetX: 0,
        offsetY: 0,
        customScale: 0.9,
        dataLabels: {
          offset: 30,
          minAngleToShowLabel: 10
        }
      }
    },
    legend: {
      position: 'bottom',
      horizontalAlign: 'center',
      fontSize: '14px',
      itemMargin: {
        horizontal: 10,
        vertical: 5
      }
    },
    dataLabels: {
      enabled: true,
      formatter: function(val: number, opts) {
        return opts.w.config.series[opts.seriesIndex] + ' (' + val.toFixed(1) + '%)';
      },
      style: {
        fontSize: '12px',
        fontFamily: 'Helvetica, Arial, sans-serif',
        fontWeight: 'bold',
        colors: ['#fff']
      },
      background: {
        enabled: true,
        foreColor: '#000',
        padding: 8,
        borderRadius: 2,
        borderWidth: 2,
        borderColor: '#313e75',
      },
      dropShadow: {
        enabled: false
      }
    }
  };
}