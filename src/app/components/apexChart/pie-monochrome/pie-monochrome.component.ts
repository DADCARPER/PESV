import { Component } from '@angular/core';
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
  theme: ApexTheme;
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
        [theme]="chartOptions.theme"
        [plotOptions]="chartOptions.plotOptions"
        [legend]="chartOptions.legend"
        [dataLabels]="chartOptions.dataLabels"
      ></apx-chart>
    </div>
  `
})
export class PieMonochromeComponent {

  chartOptions: ChartOptions = {
    series: [8, 50], // SI: 8, NO: 50
    chart: {
      type: "pie",
      height: 250,
      animations: {
        enabled: true,
        speed: 400,
        animateGradually: {
          enabled: true,
          delay: 150
        }
      }
    },
    labels: ["SI", "NO"],
    theme: {
      monochrome: {
        enabled: true,
        color: '#2E93fA',  // Color base
        shadeTo: 'light',  // 'light' o 'dark'
        shadeIntensity: 0.65
      }
    },
    plotOptions: {
      pie: {
        startAngle: 0,
        endAngle: 360,
        expandOnClick: true,
        offsetX: 0,
        offsetY: 0,
        customScale: 1,
        dataLabels: {
          offset: 0,
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
        fontSize: '14px',
        fontFamily: 'Helvetica, Arial, sans-serif',
        fontWeight: 'bold'
      },
      dropShadow: {
        enabled: false
      }
    }
  };

}
