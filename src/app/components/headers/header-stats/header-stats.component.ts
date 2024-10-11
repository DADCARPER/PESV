import { Component, OnInit, Input } from "@angular/core";
import { CardStatsComponent } from "../../cards/card-stats/card-stats.component";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-header-stats",
  standalone: true,
  imports: [CardStatsComponent,CommonModule],
  templateUrl: "./header-stats.component.html",
})
export class HeaderStatsComponent implements OnInit {

  @Input() muestrastats: boolean = true;

  constructor() {}

  ngOnInit(): void {}
}
