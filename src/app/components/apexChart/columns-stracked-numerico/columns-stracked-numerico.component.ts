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
  ApexPlotOptions,
  ApexTooltip
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
  tooltip: ApexTooltip;
};

@Component({
  selector: 'app-columns-stracked-numerico',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  templateUrl: './columns-stracked-numerico.component.html',
  styleUrl: './columns-stracked-numerico.component.css'
})
export class ColumnsStrackedNumericoComponent implements OnInit, OnChanges {

  @Input() data: number[] = [];
  @Input() categories: string[] = [];
  /** true → barras y tooltip muestran % | false → barras y tooltip muestran cantidad */
  @Input() mostrarPorcentaje: boolean = true;

  private _rawData: number[] = [];
  public chartOptions: ChartOptions;

  constructor() {
    this.chartOptions = this.initializeChartOptions();
  }

  ngOnInit(): void {
    this.updateChartOptions();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] || changes['categories'] || changes['mostrarPorcentaje']) {
      this.updateChartOptions();
    }
  }

  private formatPct(val: number): string {
    return Number.isInteger(val) ? `${val}%` : `${val.toFixed(2)}%`;
  }

  private initializeChartOptions(): ChartOptions {
    return {
      series: [{ name: 'Cantidad', data: [] }],
      chart: {
        type: 'bar',
        height: 300,
        toolbar: { show: false },
        animations: { dynamicAnimation: { enabled: false } },
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
          dataLabels: { position: 'top' }
        }
      },
      dataLabels: {
        enabled: true,
        formatter: (val: any) => typeof val === 'number' ? val.toFixed(0) : val,
        offsetY: 50,
        style: { fontSize: '12px', fontWeight: 'bold', colors: ['#fff'] },
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
        labels: { style: { fontSize: '12px' } }
      },
      yaxis: {
        min: 0, max: 100, tickAmount: 5,
        labels: { formatter: (val) => `${val.toFixed(0)}%` }
      },
      grid: {
        borderColor: '#f1f1f1',
        xaxis: { lines: { show: true } },
        yaxis: { lines: { show: true } }
      },
      tooltip: {}
    };
  }

  private updateChartOptions(): void {
    const total = this.data.reduce((s, v) => s + v, 0);
    this._rawData = [...this.data];

    const pctData = total > 0
      ? this.data.map(v => Math.round((v / total) * 10000) / 100)
      : this.data.map(() => 0);

    const base = this.initializeChartOptions();

    if (this.mostrarPorcentaje) {
      this.chartOptions = {
        ...base,
        series: [{ name: '%', data: pctData }],
        xaxis: { ...base.xaxis, categories: this.categories },
        yaxis: {
          min: 0, max: 100, tickAmount: 5,
          labels: { formatter: (val) => `${val.toFixed(0)}%` }
        },
        dataLabels: {
          ...base.dataLabels,
          formatter: (val: any) => typeof val === 'number' ? this.formatPct(val) : val
        },
        tooltip: {
          enabled: true, followCursor: true, intersect: true, shared: false,
          marker: { show: false },
          custom: ({ dataPointIndex }: any) => {
            const cat = this.categories[dataPointIndex] ?? '';
            const count = this._rawData[dataPointIndex] ?? 0;
            return `<div style="padding:8px 12px;font-size:13px">
              <span style="color:#666">${cat}</span><br/><b>Cantidad: ${count}</b>
            </div>`;
          }
        }
      };
    } else {
      this.chartOptions = {
        ...base,
        series: [{ name: 'Cantidad', data: this._rawData }],
        xaxis: { ...base.xaxis, categories: this.categories },
        yaxis: {
          min: 0, tickAmount: 5,
          labels: { formatter: (val) => val.toFixed(0) }
        },
        dataLabels: {
          ...base.dataLabels,
          formatter: (val: any) => typeof val === 'number' ? val.toFixed(0) : val
        },
        tooltip: {
          enabled: true, followCursor: true, intersect: true, shared: false,
          marker: { show: false },
          custom: ({ dataPointIndex }: any) => {
            const cat = this.categories[dataPointIndex] ?? '';
            const count = this._rawData[dataPointIndex] ?? 0;
            return `<div style="padding:8px 12px;font-size:13px">
              <span style="color:#666">${cat}</span><br/><b>Cantidad: ${count}</b>
            </div>`;
          }
        }
      };
    }
  }
}
