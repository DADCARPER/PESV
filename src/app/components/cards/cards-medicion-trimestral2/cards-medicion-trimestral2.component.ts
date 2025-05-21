import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ProgressBarComponent } from "../../otros/progress-bar/progress-bar.component";
import { ProgressBarDobleComponent } from "../../otros/progress-bar-doble/progress-bar-doble.component";

@Component({
  selector: 'app-cards-medicion-trimestral2',
  standalone: true,
  imports: [CommonModule, ProgressBarComponent, ProgressBarDobleComponent],
  templateUrl: './cards-medicion-trimestral2.component.html',
  styleUrl: './cards-medicion-trimestral2.component.css'
})
export class CardsMedicionTrimestral2Component {

  @Input() titulo = "Titulo";
  @Input() subtitulo1 = "1 Trimestre";
  @Input() subtitulo2 = "2 Trimestre";
  @Input() subtitulo3 = "3 Trimestre";
  @Input() subtitulo4 = "4 Trimestre";
  @Input() valorActual1: number = 5;
  @Input() valorActualPorcentaje1: number = 50;
  @Input() valorMeta1: number = 10;
  @Input() Meta1Porcentaje: number = 50;
  @Input() valorActual2: number = 8;
  @Input() valorActualPorcentaje2: number = 80;
  @Input() valorMeta2: number = 10;
  @Input() Meta2Porcentaje: number = 80;
  @Input() valorActual3: number = 2;
  @Input() valorActualPorcentaje3: number = 20;
  @Input() valorMeta3: number = 10;
  @Input() valorActual4: number = 10;
  @Input() valorActualPorcentaje4: number = 100;
  @Input() valorMeta4: number = 10;
  @Input() fondoColor = "bg-white";
  @Input() borderColor = "border-gray-100";
  @Input() textColor = "text-amber-600";


}
