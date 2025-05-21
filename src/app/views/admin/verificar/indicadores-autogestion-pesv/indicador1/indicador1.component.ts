import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { TablaSimpleComponent } from "../../../../../components/tablas/tabla-simple/tabla-simple.component";
import { TablaCompartidaComponent } from "../../../../../components/tablas/tabla-compartida/tabla-compartida.component";
import { TablaLeftComponent } from "../../../../../components/tablas/tabla-left/tabla-left.component";
import { CardsMetasResultadosComponent } from "../../../../../components/cards/cards-metas-resultados/cards-metas-resultados.component";
import { ProgressRingComponent } from "../../../../../components/otros/progress-ring/progress-ring.component";
import { ProgressBarComponent } from "../../../../../components/otros/progress-bar/progress-bar.component";
import { CardsMedicionTrimestralComponent } from "../../../../../components/cards/cards-medicion-trimestral/cards-medicion-trimestral.component";
import { CardsMedicionAnualComponent } from "../../../../../components/cards/cards-medicion-anual/cards-medicion-anual.component";

@Component({
  selector: 'app-indicador1',
  standalone: true,
  imports: [TablaSimpleComponent, TablaCompartidaComponent, TablaLeftComponent, CardsMetasResultadosComponent, ProgressRingComponent, ProgressBarComponent, CardsMedicionTrimestralComponent, CardsMedicionAnualComponent],
  templateUrl: './indicador1.component.html',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  styleUrl: './indicador1.component.css'
})
export class Indicador1Component {

  datos=["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE", "TOTAL", "UNIDAD"];
}
