import { Component } from '@angular/core';
import { CardsMedicionMensualComponent } from "../../../../../components/cards/cards-medicion-mensual/cards-medicion-mensual.component";
import { CardsMedicionTrimestral2Component } from "../../../../../components/cards/cards-medicion-trimestral2/cards-medicion-trimestral2.component";
import { CardsMedicionAnual2Component } from "../../../../../components/cards/cards-medicion-anual2/cards-medicion-anual2.component";
import { TablaLeftComponent } from "../../../../../components/tablas/tabla-left/tabla-left.component";

@Component({
  selector: 'app-indicador6',
  standalone: true,
  imports: [CardsMedicionMensualComponent, CardsMedicionTrimestral2Component, CardsMedicionAnual2Component, TablaLeftComponent],
  templateUrl: './indicador6.component.html',
  styleUrl: './indicador6.component.css'
})
export class Indicador6Component {

  datos=["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE", "TOTAL", "UNIDAD"];
}
