import { Component } from '@angular/core';
import { CardStatsComponent } from "../../../../components/cards/card-stats/card-stats.component";
import { CardTableComponent } from "../../../../components/cards/card-table/card-table.component";
import { SubirArchivosComponent } from "../../../../components/otros/subir-archivos/subir-archivos.component";
import { TablaArchivosComponent } from "../../../../components/otros/tabla-archivos/tabla-archivos.component";

@Component({
  selector: 'app-responsabilidad',
  standalone: true,
  imports: [CardStatsComponent, CardTableComponent, SubirArchivosComponent, TablaArchivosComponent],
  templateUrl: './responsabilidad.component.html',
  styleUrl: './responsabilidad.component.css'
})
export class ResponsabilidadComponent {

}
