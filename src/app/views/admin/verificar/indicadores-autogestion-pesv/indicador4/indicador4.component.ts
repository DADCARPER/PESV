import { Component } from '@angular/core';
import { CardsMedicionTrimestralComponent } from "../../../../../components/cards/cards-medicion-trimestral/cards-medicion-trimestral.component";
import { CardsMedicionTrimestral2Component } from "../../../../../components/cards/cards-medicion-trimestral2/cards-medicion-trimestral2.component";
import { CardsMedicionAnual2Component } from "../../../../../components/cards/cards-medicion-anual2/cards-medicion-anual2.component";

@Component({
  selector: 'app-indicador4',
  standalone: true,
  imports: [CardsMedicionTrimestral2Component, CardsMedicionAnual2Component],
  templateUrl: './indicador4.component.html',
  styleUrl: './indicador4.component.css'
})
export class Indicador4Component {

}
