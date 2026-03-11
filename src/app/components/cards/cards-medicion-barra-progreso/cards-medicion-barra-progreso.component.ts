import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, OnChanges, SimpleChanges, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { ProgressBarComponent } from '../../otros/progress-bar/progress-bar.component';
import { CountUp } from 'countup.js';

@Component({
  selector: 'app-cards-medicion-barra-progreso',
  standalone: true,
  imports: [CommonModule,ProgressBarComponent],
  templateUrl: './cards-medicion-barra-progreso.component.html',
  styleUrl: './cards-medicion-barra-progreso.component.css'
})
export class CardsMedicionBarraProgresoComponent implements OnChanges {

  @Input() valorPorcentual: number = 50;
  @Input() textColor = "'text-amber-600'";
  @Input() colorBarra = "'#16a34d'";

  ngOnChanges() {
    this.animacionNumero();
  }

  animacionNumero() {
    new CountUp('valor-animado', this.valorPorcentual,  {duration: 2, suffix: '%', enableScrollSpy: true }).start();
    
  }

}
