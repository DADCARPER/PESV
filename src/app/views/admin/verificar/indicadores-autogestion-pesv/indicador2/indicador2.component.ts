import { Component } from '@angular/core';
import { TablaTopComponent } from "../../../../../components/tablas/tabla-top/tabla-top.component";
import { TablaSimpleComponent } from "../../../../../components/tablas/tabla-simple/tabla-simple.component";
import { TablesComponent } from "../../../tables/tables.component";
import { TablaLeftComponent } from "../../../../../components/tablas/tabla-left/tabla-left.component";
import { CardsMedicionMensualComponent } from "../../../../../components/cards/cards-medicion-mensual/cards-medicion-mensual.component";
import { CardsMedicionTrimestralComponent } from "../../../../../components/cards/cards-medicion-trimestral/cards-medicion-trimestral.component";
import { CardsMedicionAnualComponent } from "../../../../../components/cards/cards-medicion-anual/cards-medicion-anual.component";

@Component({
  selector: 'app-indicador2',
  standalone: true,
  imports: [TablaLeftComponent, CardsMedicionMensualComponent, CardsMedicionTrimestralComponent, CardsMedicionAnualComponent],
  templateUrl: './indicador2.component.html',
  styleUrl: './indicador2.component.css'
})
export class Indicador2Component {

  headertabla=["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE", "TOTAL", "UNIDAD"];
}
