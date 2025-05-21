import { Component } from '@angular/core';
import { CardsRiesgosComponent } from "../../../../../components/cards/cards-riesgos/cards-riesgos.component";
import { CardsRiesgosDonaComponent } from "../../../../../components/cards/cards-riesgos-dona/cards-riesgos-dona.component";

@Component({
  selector: 'app-indicador3',
  standalone: true,
  imports: [CardsRiesgosComponent, CardsRiesgosDonaComponent],
  templateUrl: './indicador3.component.html',
  styleUrl: './indicador3.component.css'
})
export class Indicador3Component {

}
