import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, AfterViewInit, ElementRef, ViewChild, signal } from '@angular/core';


@Component({
  selector: 'app-progress-bar-doble',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './progress-bar-doble.component.html',
  styleUrl: './progress-bar-doble.component.css'
})
export class ProgressBarDobleComponent implements OnInit, AfterViewInit {
 
  @Input() value: number = 60; // Valor por defecto 30%
  @Input() targetValue: number = 70; // Valor objetivo 80%
  @Input() maxValue: number = 100;
  @Input() height: number = 8;
  @Input() color: string = '#16a34d'; // Color amarillo
  @Input() borderRadius: number = 9999; // Redondeado completo
  @Input() animate: boolean = true;
  @Input() animationDelay: number = 300;
  @Input() showLabels: boolean = false;
  @Input() mostrarProgreso: boolean = true; // Mostrar progreso en la barra
  @Input() customLabels: {value: number, text: string, bold?: boolean}[] = [];
  
  @ViewChild('progressFill') progressFill!: ElementRef;
  
  progressWidth = signal(0);
  labels: {value: number, text: string, bold?: boolean}[] = [];
  
  constructor() {}
  
  ngOnInit() {
    // Inicializar la barra con ancho 0
    this.progressWidth.set(0);
    
    // Configurar etiquetas
    if (this.showLabels && this.customLabels.length === 0) {
      // Etiquetas predeterminadas si no se proporcionan personalizadas
      this.labels = [
        { value: 0, text: '0%' },
        { value: 50, text: '50%' },
        { value: 100, text: '100%' }
      ];
    } else {
      this.labels = this.customLabels;
    }
  }
  
  ngAfterViewInit() {
    if (this.animate) {
      // Iniciar con la barra vacía
      setTimeout(() => {
        // Calcular el nuevo ancho
        const progress = (this.value / this.maxValue) * 100;
        this.progressWidth.set(progress);
      }, this.animationDelay);
    } else {
      // Sin animación, establecer directamente el valor final
      const progress = (this.value / this.maxValue) * 100;
      this.progressWidth.set(progress);
    }
  }
  
  // Método para actualizar el valor programáticamente
  updateValue(newValue: number) {
    this.value = newValue;
    const progress = (this.value / this.maxValue) * 100;
    this.progressWidth.set(progress);
  }
}
