import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProgressCircleComponent } from "../../otros/progress-circle/progress-circle.component";

@Component({
  selector: 'app-cards-menu',
  standalone: true,
  imports: [CommonModule, RouterLink, ProgressCircleComponent],
  templateUrl: './cards-menu.component.html',
  styleUrl: './cards-menu.component.css'
})
export class CardsMenuComponent {

  @Input() titulo: string = "Responsabilidad";
  @Input() descripcion: string = "Lorem ipsum dolor sit amet consectetur adipisicing elit. Provident ab nulla quod dignissimos vel non corrupti doloribus voluptatum eveniet";
  @Input() colorIcono: string = "bg-red-400";
  @Input() tipoIcono: string = "fas fa-lightbulb";
  @Input() linkvamos:string = '/admin/planificar';
  @Input() porcentaje: number = 30;
  @Input() colorgrafica: string = "#5d7ba2";
}
