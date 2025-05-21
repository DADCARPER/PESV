import { Component, Input } from '@angular/core';
import { ProgressBarComponent } from "../../otros/progress-bar/progress-bar.component";
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cards-medicion-anual',
  standalone: true,
  imports: [CommonModule,ProgressBarComponent],
  templateUrl: './cards-medicion-anual.component.html',
  styleUrl: './cards-medicion-anual.component.css'
})
export class CardsMedicionAnualComponent {

  @Input() valorActual = "0.0";
  @Input() valorPorcentual:number = 50;
  @Input() textColor = "'text-amber-600'";
  @Input() colorBarra = "'#16a34d'";

}
