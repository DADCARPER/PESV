import { Component, OnInit } from "@angular/core";
import { CardSettingsComponent } from "../../../components/cards/card-settings/card-settings.component";
import { CardProfileComponent } from "../../../components/cards/card-profile/card-profile.component";

@Component({
  selector: "app-settings",
  standalone: true,
  imports: [CardSettingsComponent,CardProfileComponent],
  templateUrl: "./settings.component.html",
})
export class SettingsComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {}
}
