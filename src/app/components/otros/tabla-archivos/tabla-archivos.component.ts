import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { TableDropdownComponent } from "../../dropdowns/table-dropdown/table-dropdown.component";

@Component({
  selector: 'app-tabla-archivos',
  standalone: true,
  imports: [CommonModule, TableDropdownComponent],
  templateUrl: './tabla-archivos.component.html',
  styleUrl: './tabla-archivos.component.css'
})
export class TablaArchivosComponent {

  @Input()
  get color(): string {
    return this._color;
  }
  set color(color: string) {
    this._color = color !== 'light' && color !== 'dark' ? 'light' : color;
  }
  private _color = 'light';

  // Array que contiene los datos de las filas de la tabla
  archivos = [
    {
      categoria: 'LÍDER DEL PESV',
      numArchivos: '0 / 1',
      estado: 'Pendiente',
      porcentaje: 60
    },
    {
      categoria: 'DOCUMENTOS LEGALES',
      numArchivos: '1 / 1',
      estado: 'Completado',
      porcentaje: 100
    },
    {
      categoria: 'ACTAS DE REUNIÓN',
      numArchivos: '2 / 4',
      estado: 'En Proceso',
      porcentaje: 50
    }
  ];

  constructor() {}


}
