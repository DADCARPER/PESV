import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CardProfileComponent } from "../../../components/cards/card-profile/card-profile.component";
import { CardStatsComponent } from '../../../components/cards/card-stats/card-stats.component';
import { CardsMenuComponent } from "../../../components/cards/cards-menu/cards-menu.component";

@Component({
  selector: 'app-planificar',
  standalone: true,
  imports: [RouterModule, CardProfileComponent, CardStatsComponent, CardsMenuComponent],
  templateUrl: './planificar.component.html',
  styleUrl: './planificar.component.css'
})
export class PlanificarComponent {

}
