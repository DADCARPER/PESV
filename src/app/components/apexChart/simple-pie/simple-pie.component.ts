import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  NgApexchartsModule,
  ApexNonAxisChartSeries,
  ApexChart
} from "ng-apexcharts";

export type ChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  labels: string[];
};

@Component({
  selector: 'app-simple-pie',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  template: `
    <div class="w-full max-w-lg mx-auto p-4">
      <apx-chart
        [series]="chartOptions.series"
        [chart]="chartOptions.chart"
        [labels]="chartOptions.labels"
      ></apx-chart>
    </div>
  `
})
export class SimplePieComponent {

  chartOptions: ChartOptions = {
    series: [44, 55, 13, 33],
    chart: {
      width: 380,
      type: "pie"
    },
    labels: ["Ventas", "Marketing", "Desarrollo", "Soporte"]
  };
  
}
