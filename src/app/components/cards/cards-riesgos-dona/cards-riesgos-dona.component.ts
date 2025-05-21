import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-cards-riesgos-dona',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cards-riesgos-dona.component.html',
  styleUrl: './cards-riesgos-dona.component.css'
})
export class CardsRiesgosDonaComponent {

  @Input() titulo = "Titulo";
  @Input() subtexto = "subtexto";
  @Input() valorActual = "0.0";
  @Input() valorPorcentual:number = 50;
  @Input() textColor = "'text-amber-600'";
  @Input() colorBarra = "'#16a34d'";

}
