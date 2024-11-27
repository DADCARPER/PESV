import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-pasopaso',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pasopaso.component.html',
  styleUrl: './pasopaso.component.css'
})
export class PasopasoComponent {

  @Input() color: string = 'text-orange-500';
  @Input() borde: string = 'border-orange-500';
  @Input() steps: string[] = ['Personal Info', 'Account Info', 'Review','Completo'];

  pasos: number = 1;
  

  nextStep() {
    if (this.pasos < this.steps.length) {
      this.pasos++;
    }
  }

  prevStep() {
    if (this.pasos > 1) {
      this.pasos--;
    }
  }

  getStepClass(index: number): string {
    if (index < this.pasos) {
      return `${this.borde} ${this.color}`;
    } else {
      return 'border-gray-400 text-gray-400';
    }
  }

}
