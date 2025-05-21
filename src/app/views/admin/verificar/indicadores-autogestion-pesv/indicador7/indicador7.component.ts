import { Component } from '@angular/core';
import { TablaLeftComponent } from "../../../../../components/tablas/tabla-left/tabla-left.component";
import { CardsMedicionMensualComponent } from "../../../../../components/cards/cards-medicion-mensual/cards-medicion-mensual.component";
import { CardsMedicionAnual2Component } from "../../../../../components/cards/cards-medicion-anual2/cards-medicion-anual2.component";
import { CardsMedicionTrimestral2Component } from "../../../../../components/cards/cards-medicion-trimestral2/cards-medicion-trimestral2.component";

@Component({
  selector: 'app-indicador7',
  standalone: true,
  imports: [TablaLeftComponent, CardsMedicionMensualComponent, CardsMedicionAnual2Component, CardsMedicionTrimestral2Component],
  templateUrl: './indicador7.component.html',
  styleUrl: './indicador7.component.css'
})
export class Indicador7Component {

  datos=["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE", "TOTAL", "UNIDAD"];

}
