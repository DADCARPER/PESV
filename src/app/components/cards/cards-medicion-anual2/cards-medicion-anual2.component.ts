import { CommonModule } from '@angular/common';
import { Component, Input, input } from '@angular/core';
import { ProgressBarDobleComponent } from "../../otros/progress-bar-doble/progress-bar-doble.component";

@Component({
  selector: 'app-cards-medicion-anual2',
  standalone: true,
  imports: [CommonModule, ProgressBarDobleComponent],
  templateUrl: './cards-medicion-anual2.component.html',
  styleUrl: './cards-medicion-anual2.component.css'
})
export class CardsMedicionAnual2Component {

  @Input() titulo = "Medición Anual";
  @Input() fondoColor = "";
  @Input() borderColor = "";
  @Input() textColor = "";
  @Input() ano_actual = "2000";
  @Input() valorActual = "0";
  @Input() valorMeta = "18";

}
