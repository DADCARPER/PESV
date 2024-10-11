import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CardProfileComponent } from "../../../components/cards/card-profile/card-profile.component";

@Component({
  selector: 'app-planificar',
  standalone: true,
  imports: [RouterModule, CardProfileComponent],
  templateUrl: './planificar.component.html',
  styleUrl: './planificar.component.css'
})
export class PlanificarComponent {

}
