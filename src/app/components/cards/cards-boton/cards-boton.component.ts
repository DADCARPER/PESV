import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';


@Component({
  selector: 'app-cards-boton',
  standalone: true,
  imports: [CommonModule,RouterLink],
  templateUrl: './cards-boton.component.html',
  styleUrl: './cards-boton.component.css'
})
export class CardsBotonComponent {

  @Input() titulo: string = "Responsabilidad";
  @Input() descripcion: string = "Lorem ipsum dolor sit amet consectetur adipisicing elit. Provident ab nulla quod dignissimos vel non corrupti doloribus voluptatum eveniet";
  @Input() colorIcono: string = "bg-red-400";
  @Input() tipoIcono: string = "fas fa-lightbulb";
  @Input() linkvamos: string | null = "";
  

}
