import { Component, Input } from '@angular/core';
import { ProgressBarComponent } from "../../otros/progress-bar/progress-bar.component";

@Component({
  selector: 'app-cards-metas-resultados',
  standalone: true,
  imports: [ProgressBarComponent],
  templateUrl: './cards-metas-resultados.component.html',
  styleUrl: './cards-metas-resultados.component.css'
})
export class CardsMetasResultadosComponent {

  @Input() nombre = "Nombre de la meta";
  @Input() subnombre = "Unidad de medida";
  @Input() valorActual = "0.0";
  @Input() valorMeta = "10.0";
  @Input() valorColorBarra = "success";
  @Input() color = "#000000";

}
