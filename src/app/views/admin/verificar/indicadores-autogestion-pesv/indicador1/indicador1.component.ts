import { Component } from '@angular/core';
import { TablaSimpleComponent } from "../../../../../components/tablas/tabla-simple/tabla-simple.component";
import { TablaCompartidaComponent } from "../../../../../components/tablas/tabla-compartida/tabla-compartida.component";

@Component({
  selector: 'app-indicador1',
  standalone: true,
  imports: [TablaSimpleComponent, TablaCompartidaComponent],
  templateUrl: './indicador1.component.html',
  styleUrl: './indicador1.component.css'
})
export class Indicador1Component {

  datos=["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE", "TOTAL", "UNIDAD"];
}
