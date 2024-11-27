import { Component, OnInit } from "@angular/core";
import { CardSettingsComponent } from "../../../components/cards/card-settings/card-settings.component";
import { CardTableComponent } from "../../../components/cards/card-table/card-table.component";
import { CardTarjetaComponent } from "../../../components/cards/card-tarjeta/card-tarjeta.component";

@Component({
  selector: "app-dashboard",
  standalone: true,
  imports: [CardSettingsComponent, CardTableComponent, CardTarjetaComponent],
  templateUrl: "./dashboard.component.html",
})
export class DashboardComponent implements OnInit {
  constructor() {}

  ngOnInit() {}
}
