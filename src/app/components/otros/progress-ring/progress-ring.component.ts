import { Component,Input, ViewChild, ElementRef, signal, OnInit, AfterViewInit } from '@angular/core';

@Component({
  selector: 'app-progress-ring',
  standalone: true,
  imports: [],
  templateUrl: './progress-ring.component.html',
  styleUrl: './progress-ring.component.css'
})
export class ProgressRingComponent implements OnInit, AfterViewInit {

  @Input() value: number = 0;
  @Input() maxValue: number = 100;
  @Input() size: number = 60;
  @Input() strokeWidth: number = 3;
  @Input() color: string = '#eab308'; // Color amarillo
  @Input() animate: boolean = true;
  @Input() animationDelay: number = 300;
  @Input() showText: boolean = true;
  @Input() showPercent: boolean = true;
  @Input() textColor: string = '#eab308';
  
  @ViewChild('progressCircle') progressCircle!: ElementRef;
  
  radius: number = 16;
  circumference: number = 0;
  dashOffset = signal(0);
  displayValue: string = '0';
  
  constructor(private el: ElementRef) {}
  
  ngOnInit() {
    // Calcular el radio y la circunferencia
    this.radius = 18 - (this.strokeWidth / 2);
    this.circumference = 2 * Math.PI * this.radius;
    
    // Inicializar el dashOffset al máximo (círculo vacío)
    this.dashOffset.set(this.circumference);
    
    // Calcular el valor a mostrar
    const percentage = Math.round((this.value / this.maxValue) * 100);
    this.displayValue = percentage.toString();
  }
  
  ngAfterViewInit() {
    if (this.animate) {
      // Iniciar con el círculo vacío
      setTimeout(() => {
        // Calcular el nuevo valor de dashOffset
        const progress = this.value / this.maxValue;
        const newOffset = this.circumference - (progress * this.circumference);
        this.dashOffset.set(newOffset);
      }, this.animationDelay);
    } else {
      // Sin animación, establecer directamente el valor final
      const progress = this.value / this.maxValue;
      const newOffset = this.circumference - (progress * this.circumference);
      this.dashOffset.set(newOffset);
    }
  }
  
  // Método para actualizar el valor programáticamente
  updateValue(newValue: number) {
    this.value = newValue;
    const percentage = Math.round((this.value / this.maxValue) * 100);
    this.displayValue = percentage.toString();
    
    const progress = this.value / this.maxValue;
    const newOffset = this.circumference - (progress * this.circumference);
    this.dashOffset.set(newOffset);
  }
}
