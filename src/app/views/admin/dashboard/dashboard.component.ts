import { Component, OnInit } from "@angular/core";
import { CardLineChartComponent } from "../../../components/cards/card-line-chart/card-line-chart.component";
import { CardBarChartComponent } from "../../../components/cards/card-bar-chart/card-bar-chart.component";
import { CardPageVisitsComponent } from "../../../components/cards/card-page-visits/card-page-visits.component";
import { CardSocialTrafficComponent } from "../../../components/cards/card-social-traffic/card-social-traffic.component";

@Component({
  selector: "app-dashboard",
  standalone: true,
  imports: [CardLineChartComponent,CardBarChartComponent,CardPageVisitsComponent,CardSocialTrafficComponent],
  templateUrl: "./dashboard.component.html",
})
export class DashboardComponent implements OnInit {
  constructor() {}

  ngOnInit() {}
}
