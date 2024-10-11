import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";

@Component({
  selector: "app-card-page-visits",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./card-page-visits.component.html",
})
export class CardPageVisitsComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {}
}
