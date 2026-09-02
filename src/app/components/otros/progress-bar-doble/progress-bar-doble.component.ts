import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, OnChanges, SimpleChanges, AfterViewInit, ElementRef, ViewChild, signal } from '@angular/core';


@Component({
  selector: 'app-progress-bar-doble',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './progress-bar-doble.component.html',
  styleUrl: './progress-bar-doble.component.css'
})
export class ProgressBarDobleComponent implements OnInit, OnChanges, AfterViewInit {
 
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
  /**
   * Texto ya formateado para la etiqueta de progreso. Permite mostrar decimales
   * o un guion cuando no hay medición, en vez del crudo `value`.
   */
  @Input() textoProgreso: string = '';
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
  
  /**
   * El valor suele llegar después del primer render, cuando termina la consulta
   * a Firestore. Sin esto la barra se quedaba en su ancho inicial mientras la
   * etiqueta ya mostraba el dato nuevo.
   */
  ngOnChanges(changes: SimpleChanges) {
    if (changes['value'] && !changes['value'].firstChange) {
      this.progressWidth.set(this.anchoActual());
    }
  }

  /**
   * La marca de meta se desplaza en proporción a su posición: al 0% queda
   * pegada por la izquierda, al 50% centrada y al 100% alineada por la derecha.
   * Con el translateX(-50%) fijo anterior, la marca del 100% se salía del marco.
   */
  get desplazamientoMeta(): string {
    const t = Math.min(100, Math.max(0, this.targetValue));
    return `translateX(-${t}%)`;
  }

  private anchoActual(): number {
    if (!this.maxValue) return 0;
    return Math.min(100, Math.max(0, (this.value / this.maxValue) * 100));
  }

  ngAfterViewInit() {
    if (this.animate) {
      // Iniciar con la barra vacía
      setTimeout(() => this.progressWidth.set(this.anchoActual()), this.animationDelay);
    } else {
      // Sin animación, establecer directamente el valor final
      this.progressWidth.set(this.anchoActual());
    }
  }
  
  // Método para actualizar el valor programáticamente
  updateValue(newValue: number) {
    this.value = newValue;
    this.progressWidth.set(this.anchoActual());
  }
}
