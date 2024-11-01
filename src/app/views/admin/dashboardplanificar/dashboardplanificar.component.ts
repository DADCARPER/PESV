import { Component } from '@angular/core';
import { CardSettingsComponent } from "../../../components/cards/card-settings/card-settings.component";
import { CardTableComponent } from "../../../components/cards/card-table/card-table.component";
import { CardTarjetaComponent } from "../../../components/cards/card-tarjeta/card-tarjeta.component";

@Component({
  selector: 'app-dashboardplanificar',
  standalone: true,
  imports: [CardSettingsComponent, CardTableComponent, CardTarjetaComponent],
  templateUrl: './dashboardplanificar.component.html',
  styleUrl: './dashboardplanificar.component.css'
})
export class DashboardplanificarComponent {

}
