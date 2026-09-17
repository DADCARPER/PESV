import { CommonModule } from '@angular/common';
import { Component, Input, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-cards-menu',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './cards-menu.component.html',
  schemas:[CUSTOM_ELEMENTS_SCHEMA],
  styleUrl: './cards-menu.component.css'
})
export class CardsMenuComponent {

  @Input() titulo: string = "Responsabilidad";
  @Input() descripcion: string = "Lorem ipsum dolor sit amet consectetur adipisicing elit. Provident ab nulla quod dignissimos vel non corrupti doloribus voluptatum eveniet";
  @Input() colorIcono: string = "bg-red-400";
  @Input() tipoIcono: string = "package-process";
  @Input() linkvamos:string = '/admin/planificar';
  @Input() porcentaje: number = 30;
  @Input() colorgrafica: string = "#5d7ba2";
  @Input() muestradona: boolean = true;
  @Input() iniciado: boolean = true;
  /**
   * Si el paso se le exige a la empresa según su nivel PESV. Cuando no, la
   * tarjeta se atenúa y cambia el avance por la marca «no aplica a su nivel».
   * Sigue siendo navegable: la empresa puede ver lo que exigiría un nivel mayor.
   */
  @Input() aplica: boolean = true;
  @Input() textoNoAplica: string = "No aplica a su nivel";
}
