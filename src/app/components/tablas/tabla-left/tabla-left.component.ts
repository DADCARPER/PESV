import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-tabla-left',
  standalone: true,
  imports: [],
  templateUrl: './tabla-left.component.html',
  styleUrl: './tabla-left.component.css'
})
export class TablaLeftComponent {

  @Input() tipo: string = "Tipo"; // Cambiado a string para mayor flexibilidad
  @Input() headers: string[] = []; // Cambiado a string[] para mayor flexibilidad
  @Input() leftheaders: string[] = ["1. TSV Fatales","2. Heridos graves de 30 días de incapacidad ","3. TVS Heridos Leves","4. TVSA Choques Simples"];
  @Input() datas: any[] = ["0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "216000", "km"]; // Cambiado a any[] para mayor flexibilidad
  /**
   * Una fila de valores por cada `leftheaders`. Cuando viene vacío se repite
   * `datas` en todas las filas, que es el comportamiento original.
   */
  @Input() filas: any[][] = [];
  @Input() loading: boolean = false;
  @Input() accion: boolean = false; // Muestra o no el botón de acción

  /** Valores que corresponden a la fila `indice`. */
  filaDe(indice: number): any[] {
    return this.filas.length > 0 ? (this.filas[indice] ?? []) : this.datas;
  }
}
