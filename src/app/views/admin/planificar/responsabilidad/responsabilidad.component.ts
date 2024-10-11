import { Component } from '@angular/core';
import { CardStatsComponent } from "../../../../components/cards/card-stats/card-stats.component";
import { CardTableComponent } from "../../../../components/cards/card-table/card-table.component";

@Component({
  selector: 'app-responsabilidad',
  standalone: true,
  imports: [CardStatsComponent, CardTableComponent],
  templateUrl: './responsabilidad.component.html',
  styleUrl: './responsabilidad.component.css'
})
export class ResponsabilidadComponent {

}
