import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-card-tarjeta',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './card-tarjeta.component.html',
  styleUrl: './card-tarjeta.component.css'
})
export class CardTarjetaComponent {

  @Input() icono:string = 'fas fa-lightbulb';
  @Input() urlimg:string = 'assets/img/iconosmenu/1.png';
  @Input() titulo:string = 'Planear';
  @Input() descripcion:string = 'Consiste en diseñar y planificar el PESV, identificando los objetivos, metas, recursos y estrategias para mejorar la seguridad vial dentro de la organización.';
  @Input() color:string = 'bg-red-400';
  @Input() linkvamos:string = '#';
}
