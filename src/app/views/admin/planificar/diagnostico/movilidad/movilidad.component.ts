import { Component } from '@angular/core';
import { ColumnsStrackedComponent } from "../../../../../components/apexChart/columns-stracked/columns-stracked.component";
import { ColumnsStrackedIconosComponent } from "../../../../../components/apexChart/columns-stracked-iconos/columns-stracked-iconos.component";
import { ColumnsStrackedHorizontalComponent } from "../../../../../components/apexChart/columns-stracked-horizontal/columns-stracked-horizontal.component";

@Component({
  selector: 'app-movilidad',
  standalone: true,
  imports: [ColumnsStrackedComponent, ColumnsStrackedIconosComponent, ColumnsStrackedHorizontalComponent],
  templateUrl: './movilidad.component.html',
  styleUrl: './movilidad.component.css'
})
export class MovilidadComponent {

}
