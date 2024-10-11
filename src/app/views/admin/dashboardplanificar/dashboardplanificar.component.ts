import { Component } from '@angular/core';
import { CardSettingsComponent } from "../../../components/cards/card-settings/card-settings.component";
import { CardTableComponent } from "../../../components/cards/card-table/card-table.component";

@Component({
  selector: 'app-dashboardplanificar',
  standalone: true,
  imports: [CardSettingsComponent, CardTableComponent],
  templateUrl: './dashboardplanificar.component.html',
  styleUrl: './dashboardplanificar.component.css'
})
export class DashboardplanificarComponent {

}
