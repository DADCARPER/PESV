import { Component, CUSTOM_ELEMENTS_SCHEMA, viewChild, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TablaCompartidaComponent } from "../../../../../components/tablas/tabla-compartida/tabla-compartida.component";
import { Form1SedesComponent } from './form1-sedes/form1-sedes.component';
import { Form2SedesComponent } from './form2-sedes/form2-sedes.component';

@Component({
  selector: 'app-sedes',
  standalone: true,
  imports: [CommonModule, TablaCompartidaComponent, Form1SedesComponent, Form2SedesComponent],
  templateUrl: './sedes.component.html',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  styleUrl: './sedes.component.css'
})
export class SedesComponent {

  modalFormulario = viewChild.required<Form1SedesComponent>('modalFormulario');
  modalEliminar = viewChild.required<Form2SedesComponent>('modalEliminar');

  heads=["#","SEDE","ACTIVIDAD","DEPARTAMENTO","CIUDAD","DIRECCIÓN","TELEFONO"];
  @Input() datos:any=[];


  constructor() { }


  mostrarModalFormulario(modo: string, datoaEditar?: {}): void { /// paso el dato a editar debe ser opcional ya que solo es en caso de editar
    this.modalFormulario().abrirModal(modo,datoaEditar);
  }

  manejarEdicion(dato: any) {
    // Aquí implementas la lógica para editar
    // Por ejemplo, abrir un modal, navegar a otra página, etc.
    //console.log('Donde diocli editar -->>>>', dato);
    this.mostrarModalFormulario("editar",dato);
  }

  manejarEliminar(idDocumento: string){
    this.modalEliminar().abrirModal(idDocumento);
  }

 


}
