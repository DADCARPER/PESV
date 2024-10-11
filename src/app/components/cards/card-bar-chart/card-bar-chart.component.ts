import { Component, OnInit, AfterViewInit } from "@angular/core";
import Chart, { ChartConfiguration } from "chart.js/auto";

@Component({
  selector: "app-card-bar-chart",
  standalone: true,
  templateUrl: "./card-bar-chart.component.html",
})
export class CardBarChartComponent implements OnInit, AfterViewInit {
  constructor() {}

  ngOnInit() {}

  ngAfterViewInit() {
    const config: ChartConfiguration = {
      type: "bar",
      data: {
        labels: ["January", "February", "March", "April", "May", "June", "July"],
        datasets: [
          {
            label: `${new Date().getFullYear()}`,
            backgroundColor: "#ed64a6",
            borderColor: "#ed64a6",
            data: [30, 78, 56, 34, 100, 45, 13],
            fill: false,
            barThickness: 8,
          },
          {
            label: `${new Date().getFullYear() - 1}`,
            fill: false,
            backgroundColor: "#4c51bf",
            borderColor: "#4c51bf",
            data: [27, 68, 86, 74, 10, 4, 87],
            barThickness: 8,
          },
        ],
      },
      options: {
        maintainAspectRatio: false,
        responsive: true,
        scales: {
          x: {
            display: false,
          },
          y: {
            display: true,
          },
        },
      },
    };

    const ctx = document.getElementById("bar-chart") as HTMLCanvasElement;
    if (ctx) {
      new Chart(ctx, config);
    }
  }
}
