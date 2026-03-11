import { Component, viewChild, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { TablaTopComponent } from "../../../../../components/tablas/tabla-top/tabla-top.component";
import { TablaSimpleComponent } from "../../../../../components/tablas/tabla-simple/tabla-simple.component";
import { TablesComponent } from "../../../tables/tables.component";
import { TablaLeftComponent } from "../../../../../components/tablas/tabla-left/tabla-left.component";
import { CardsMedicionMensualComponent } from "../../../../../components/cards/cards-medicion-mensual/cards-medicion-mensual.component";
import { CardsMedicionTrimestralComponent } from "../../../../../components/cards/cards-medicion-trimestral/cards-medicion-trimestral.component";
import { CardsMedicionAnualComponent } from "../../../../../components/cards/cards-medicion-anual/cards-medicion-anual.component";
import { Formulario1Component } from "../indicador2/formulario1/formulario1.component";
import { Form2Idc2Component } from "./form2-idc2/form2-idc2.component";

@Component({
  selector: 'app-indicador2',
  standalone: true,
  imports: [TablaLeftComponent, CardsMedicionMensualComponent, CardsMedicionTrimestralComponent, CardsMedicionAnualComponent, Formulario1Component, Form2Idc2Component],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './indicador2.component.html',
  styleUrl: './indicador2.component.css'
})
export class Indicador2Component {

  modalFormulario = viewChild.required<Formulario1Component>('modalFormulario');
  modalFormulario2 = viewChild.required<Form2Idc2Component>('modalFormulario2');

  headertabla=["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE", "TOTAL", "UNIDAD"];

  mostrarModalFormulario(): void {
    this.modalFormulario().abrirModal();
  }
  mostrarModalFormulario2(): void {
    this.modalFormulario2().abrirModal();
  }
}
