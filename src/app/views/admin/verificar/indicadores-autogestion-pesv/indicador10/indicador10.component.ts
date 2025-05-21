import { Component } from '@angular/core';
import { TablaLeftComponent } from "../../../../../components/tablas/tabla-left/tabla-left.component";
import { CardsMedicionMensualComponent } from "../../../../../components/cards/cards-medicion-mensual/cards-medicion-mensual.component";
import { CardsMedicionTrimestral2Component } from "../../../../../components/cards/cards-medicion-trimestral2/cards-medicion-trimestral2.component";
import { CardsMedicionAnual2Component } from "../../../../../components/cards/cards-medicion-anual2/cards-medicion-anual2.component";

@Component({
  selector: 'app-indicador10',
  standalone: true,
  imports: [TablaLeftComponent, CardsMedicionMensualComponent, CardsMedicionTrimestral2Component, CardsMedicionAnual2Component],
  templateUrl: './indicador10.component.html',
  styleUrl: './indicador10.component.css'
})
export class Indicador10Component {

  datos=["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE", "TOTAL", "UNIDAD"];
  
}
