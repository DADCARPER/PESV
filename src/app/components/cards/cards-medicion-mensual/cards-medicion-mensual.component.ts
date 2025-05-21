import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-cards-medicion-mensual',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cards-medicion-mensual.component.html',
  styleUrl: './cards-medicion-mensual.component.css'
})
export class CardsMedicionMensualComponent {

  @Input() headers: string[] = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"]; 
  @Input() valores: string[] = ["28.352.478","28.352.478","28.352.478","28.352.478","28.352.478","28.352.478","28.352.478","0","0","0","0","0"]; 
  @Input() metas: string[] = [];
  @Input() fondoColor = "bg-amber-50";
  @Input() borderColor = "border-amber-200";
  @Input() textColor = "text-amber-600";

}
