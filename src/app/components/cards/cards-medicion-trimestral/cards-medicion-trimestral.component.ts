import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-cards-medicion-trimestral',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cards-medicion-trimestral.component.html',
  styleUrl: './cards-medicion-trimestral.component.css'
})
export class CardsMedicionTrimestralComponent {

  @Input() valorActual1 = "0.0";
  @Input() valorMeta1 = "10.0";
  @Input() valorActual2 = "0.0";
  @Input() valorMeta2 = "10.0";
  @Input() valorActual3 = "0.0";
  @Input() valorMeta3 = "10.0";
  @Input() valorActual4 = "0.0";
  @Input() valorMeta4 = "10.0";
  @Input() fondoColor = "bg-amber-50";
  @Input() borderColor = "border-amber-200";
  @Input() textColor = "text-amber-600";
}
