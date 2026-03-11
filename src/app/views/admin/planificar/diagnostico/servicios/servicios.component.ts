import { Component, CUSTOM_ELEMENTS_SCHEMA, viewChild, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Form1ServiciosComponent } from './form1-servicios/form1-servicios.component';
import { Form2ServiciosComponent } from './form2-servicios/form2-servicios.component';


@Component({
  selector: 'app-servicios',
  standalone: true,
  imports: [CommonModule, Form1ServiciosComponent,Form2ServiciosComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './servicios.component.html',
  styleUrl: './servicios.component.css'
})
export class ServiciosComponent {

  modalFormulario = viewChild.required<Form1ServiciosComponent>('modalFormulario');
  modalEliminar = viewChild.required<Form2ServiciosComponent>('modalEliminar');

  @Input() datos:any=[];


  constructor() { 
    console.log("aaaaaaaaaaaaaaaaa",this.datos);
  }


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
