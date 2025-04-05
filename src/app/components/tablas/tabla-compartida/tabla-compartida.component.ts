import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-tabla-compartida',
  standalone: true,
  imports: [],
  templateUrl: './tabla-compartida.component.html',
  styleUrl: './tabla-compartida.component.css'
})
export class TablaCompartidaComponent {

  @Input() headers: string[] = []; // Cambiado a string[] para mayor flexibilidad
  @Input() datas: any[] = ["1800", "1800", "1800", "1800", "1800", "1800", "1800", "1800", "1800", "1800", "1800", "1800", "216000", "km"]; // Cambiado a any[] para mayor flexibilidad
  @Input() loading: boolean = false;
  @Input() accion: boolean = false; // Muestra o no el botón de acción
}
