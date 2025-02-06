import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-progress-circle',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './progress-circle.component.html',
  styleUrl: './progress-circle.component.css'
})
export class ProgressCircleComponent {

  @Input() numprogreso: number = 2;
  @Input() colorgreso: string = '#fcbc7c';

  // Método para calcular el ángulo dinámico según el progreso
  get progressAngle() {
    if (this.numprogreso <= 50) {
      // Fase 1: Desde 90deg a -90deg
      return [ ['90deg, #ebebeb 50%, transparent 50%, transparent'] , [90 + (this.numprogreso * 3.6) + `deg, ${this.colorgreso} 50%, red 50%, #ebebeb`]];
    } else {
      // Fase 2: Desde -90deg a -270deg
      return [ 90 - ((100 - this.numprogreso) * 3.6) + `deg, ${this.colorgreso} 50%, transparent 50%, transparent` , `270deg, ${this.colorgreso} 50%, #ebebeb 50%, #ebebeb`];
    }
  }
}
