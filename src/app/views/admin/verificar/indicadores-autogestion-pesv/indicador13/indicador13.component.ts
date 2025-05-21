import { Component } from '@angular/core';
import { CardsMedicionMensualComponent } from "../../../../../components/cards/cards-medicion-mensual/cards-medicion-mensual.component";
import { CardsMedicionTrimestral2Component } from "../../../../../components/cards/cards-medicion-trimestral2/cards-medicion-trimestral2.component";
import { CardsMedicionAnual2Component } from "../../../../../components/cards/cards-medicion-anual2/cards-medicion-anual2.component";

@Component({
  selector: 'app-indicador13',
  standalone: true,
  imports: [CardsMedicionMensualComponent, CardsMedicionTrimestral2Component, CardsMedicionAnual2Component],
  templateUrl: './indicador13.component.html',
  styleUrl: './indicador13.component.css'
})
export class Indicador13Component {

}
