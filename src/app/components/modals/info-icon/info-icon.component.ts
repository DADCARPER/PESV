import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-info-icon',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './info-icon.component.html',
  styleUrl: './info-icon.component.css'
})
export class InfoIconComponent {

  @Input() helpText: string = ''; // El texto de ayuda que se mostrará en el modal
  @Input() ancho: string = '20rem'; // El ancho del modal, por defecto 20rem
  
  showHelp = false; // Controla la visibilidad del modal

  // Método para mostrar el modal al pasar el mouse sobre el ícono
  onMouseEnter() {
    this.showHelp = true;
  }

  // Método para ocultar el modal al salir el mouse del ícono
  onMouseLeave() {
    this.showHelp = false;
  }

}
