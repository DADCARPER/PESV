import { Component, CUSTOM_ELEMENTS_SCHEMA, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TablaSimpleComponent } from "../../../../../components/tablas/tabla-simple/tabla-simple.component";
import { TablaCompartidaComponent } from "../../../../../components/tablas/tabla-compartida/tabla-compartida.component";
import { TablaLeftComponent } from "../../../../../components/tablas/tabla-left/tabla-left.component";
import { CardsMetasResultadosComponent } from "../../../../../components/cards/cards-metas-resultados/cards-metas-resultados.component";
import { ProgressRingComponent } from "../../../../../components/otros/progress-ring/progress-ring.component";
import { ProgressBarComponent } from "../../../../../components/otros/progress-bar/progress-bar.component";
import { CardsMedicionTrimestralComponent } from "../../../../../components/cards/cards-medicion-trimestral/cards-medicion-trimestral.component";
import { CardsMedicionAnualComponent } from "../../../../../components/cards/cards-medicion-anual/cards-medicion-anual.component";
import { Formulario1Component } from './formulario1/formulario1.component';
import { Formulario2Component } from "./formulario2/formulario2.component";
import { Formulario3Component } from "./formulario3/formulario3.component";

@Component({
  selector: 'app-indicador1',
  standalone: true,
  imports: [CommonModule, TablaSimpleComponent, TablaCompartidaComponent, TablaLeftComponent, CardsMetasResultadosComponent, ProgressRingComponent, ProgressBarComponent, CardsMedicionTrimestralComponent, CardsMedicionAnualComponent, Formulario1Component, Formulario2Component, Formulario3Component],
  templateUrl: './indicador1.component.html',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  styleUrl: './indicador1.component.css'
})
export class Indicador1Component {

  modalFormulario = viewChild.required<Formulario1Component>('modalFormulario');
  modalFormulario2 = viewChild.required<Formulario2Component>('modalFormulario2');
  modalFormulario3 = viewChild.required<Formulario3Component>('modalFormulario3');

  datos=["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE", "TOTAL", "UNIDAD"];

  mostrarModalFormulario(): void {
    this.modalFormulario().abrirModal();
  }
  
  mostrarModalFormulario2(): void {
    this.modalFormulario2().abrirModal();
  }

  mostrarModalFormulario3(): void {
    this.modalFormulario3().abrirModal();
  }

}
