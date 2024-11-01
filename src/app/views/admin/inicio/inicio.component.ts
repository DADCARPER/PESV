import { Component } from '@angular/core';
import { AnimacionComponent } from "../../../components/animacion/animacion.component";
import { RegistroComponent } from "../../../components/tabs/registro/registro.component";

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [AnimacionComponent, RegistroComponent],
  templateUrl: './inicio.component.html',
  styleUrl: './inicio.component.css'
})
export class InicioComponent {

}
