import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CardsMenuComponent } from "../../../components/cards/cards-menu/cards-menu.component";

@Component({
  selector: 'app-planificar',
  standalone: true,
  imports: [RouterModule, CardsMenuComponent],
  templateUrl: './planificar.component.html',
  styleUrl: './planificar.component.css'
})
export class PlanificarComponent {

}
