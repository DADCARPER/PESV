import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";

@Component({
  selector: "app-card-social-traffic",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./card-social-traffic.component.html",
})
export class CardSocialTrafficComponent implements OnInit {

  socialTrafficData = [
    { platform: 'Facebook', visitors: 1480, percentage: 30 },
    { platform: 'Instagram', visitors: 1267, percentage: 20 },
    { platform: 'Google', visitors: 1234, percentage: 15 },
    { platform: 'Twitter', visitors: 980, percentage: 99 }
  ];

  constructor() {}

  ngOnInit(): void {}
}
