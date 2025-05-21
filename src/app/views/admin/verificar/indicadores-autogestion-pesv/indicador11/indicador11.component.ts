import { Component } from '@angular/core';
import { CardsMedicionMensualComponent } from "../../../../../components/cards/cards-medicion-mensual/cards-medicion-mensual.component";
import { CardsMedicionTrimestral2Component } from "../../../../../components/cards/cards-medicion-trimestral2/cards-medicion-trimestral2.component";
import { CardsMedicionAnual2Component } from "../../../../../components/cards/cards-medicion-anual2/cards-medicion-anual2.component";

@Component({
  selector: 'app-indicador11',
  standalone: true,
  imports: [CardsMedicionMensualComponent, CardsMedicionTrimestral2Component, CardsMedicionAnual2Component],
  templateUrl: './indicador11.component.html',
  styleUrl: './indicador11.component.css'
})
export class Indicador11Component {

}
