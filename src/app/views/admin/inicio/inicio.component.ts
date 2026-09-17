import { Component } from '@angular/core';
import { RegistroComponent } from "../../../components/tabs/registro/registro.component";

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [RegistroComponent],
  templateUrl: './inicio.component.html',
  styleUrl: './inicio.component.css'
})
export class InicioComponent {

}
