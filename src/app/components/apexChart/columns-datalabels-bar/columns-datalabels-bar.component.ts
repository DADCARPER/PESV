import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  NgApexchartsModule,
  ApexAxisChartSeries,
  ApexChart,
  ApexTitleSubtitle,
  ApexDataLabels,
  ApexStroke,
  ApexYAxis,
  ApexXAxis,
  ApexPlotOptions,
  ApexTooltip,
  ApexStates,
} from 'ng-apexcharts';
import { CauseData } from '../columns-bar-horizontal/columns-bar-horizontal.component';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  stroke: ApexStroke;
  dataLabels: ApexDataLabels;
  plotOptions: ApexPlotOptions;
  yaxis: ApexYAxis;
  tooltip: ApexTooltip;
  colors: string[];
  title: ApexTitleSubtitle;
  subtitle: ApexTitleSubtitle;
  states: ApexStates;
};

@Component({
  selector: 'app-columns-datalabels-bar',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  template: `
    @if (listo) {
      <apx-chart
        [series]="chartOptions.series!"
        [chart]="chartOptions.chart!"
        [xaxis]="chartOptions.xaxis!"
        [stroke]="chartOptions.stroke!"
        [dataLabels]="chartOptions.dataLabels!"
        [plotOptions]="chartOptions.plotOptions!"
        [yaxis]="chartOptions.yaxis!"
        [tooltip]="chartOptions.tooltip!"
        [colors]="chartOptions.colors!"
        [title]="chartOptions.title!"
        [subtitle]="chartOptions.subtitle!"
        [states]="chartOptions.states!"
      ></apx-chart>
    }
  `,
  styleUrl: './columns-datalabels-bar.component.css'
})
export class ColumnsDatalabelsBarComponent implements OnChanges {

  @Input() data: CauseData[] = [];
  @Input() alturaMinima: number = 180;
  @Input() colores: string[] = [];

  listo = false;
  public chartOptions: Partial<ChartOptions> = {};

  ngOnChanges(): void {
    this._build();
    this.listo = true;
  }

  private _build(): void {
    const altura = Math.max(this.alturaMinima, this.data.length * 55);
    this.chartOptions = {
      series: [{ data: this.data.map(d => d.porcentaje) }],
      chart: {
        type: 'bar',
        height: altura,
        toolbar: {
          show: true,
          tools: {
            download: true,
            selection: false,
            zoom: false,
            zoomin: false,
            zoomout: false,
            pan: false,
            reset: false,
          },
          export: {
            csv: { filename: 'servicios-categoria' },
            png: { filename: 'servicios-categoria' },
          }
        },
        animations: { dynamicAnimation: { enabled: false } }
      },
      states: {
        hover: {
          filter: {
            type: 'darken',
          }
        }
      },
      plotOptions: {
        bar: {
          barHeight: '95%',
          distributed: true,
          horizontal: true,
          dataLabels: { position: 'center' }, // top | center | bottom
        }
      },
      colors: this.colores.length > 0 ? this.colores : [
        '#fbbf24', '#f59e0b', '#e8930a', '#d97706', '#c86d06',
        '#b45309', '#9f4b08', '#92400e', '#78350f', '#78350f'
      ],
      dataLabels: {
        enabled: true,
        textAnchor: 'middle', //start-middle-end
        style: { colors: ['#fff'], fontSize: '12px' },
        formatter: (val: number, opt: any) => {
          const label = opt.w.globals.labels[opt.dataPointIndex] ?? '';
          const pct = (val % 1 === 0 ? val.toFixed(0) : val.toFixed(2)) + '%';
          return `${label}: ${pct}`;
        },
        offsetX: 0,
        dropShadow: { enabled: true }
      },
      stroke: { width: 1, colors: ['#fff'] },
      xaxis: {
        categories: this.data.map(d => d.causa),
        labels: { formatter: (val: string) => val + '%' }
      },
      yaxis: { labels: { show: false } },
      // title:    { text: '' },
      // subtitle: { text: '' },
      tooltip: {
        theme: 'dark',
        x: { show: true },
        y: {
          formatter: (_val: number, opts: any) => {
            const idx = opts?.dataPointIndex ?? 0;
            const item = this.data[idx];
            if (item?.cantidad !== undefined) {
              return `${item.cantidad}`;
            }
            return (_val % 1 === 0 ? _val.toFixed(0) : _val.toFixed(2)) + '%';
          },
          title: { formatter: () => 'Total : ' }
        }
      }
    };
  }
}
