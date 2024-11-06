import { CommonModule } from '@angular/common';
import { Component, input, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-cards-menu',
  standalone: true,
  imports: [CommonModule,RouterLink],
  templateUrl: './cards-menu.component.html',
  styleUrl: './cards-menu.component.css'
})
export class CardsMenuComponent {

  @Input() titulo: string = "Responsabilidad";
  @Input() descripcion: string = "Lorem ipsum dolor sit amet consectetur adipisicing elit. Provident ab nulla quod dignissimos vel non corrupti doloribus voluptatum eveniet";
  @Input() colorIcono: string = "bg-red-400";
  @Input() tipoIcono: string = "fas fa-lightbulb";
  @Input() linkvamos:string = '/admin/planificar';
}
