import { Component } from '@angular/core';
import { LottieComponent } from 'ngx-lottie';

@Component({
  selector: 'app-animacion',
  standalone: true,
  imports: [LottieComponent],
  templateUrl: './animacion.component.html',
  styleUrls: ['./animacion.component.css']
})
export class AnimacionComponent {
  lottieConfig: any;

  constructor() {
    this.lottieConfig = {
      path: 'assets/animados/AnimationEngrane.json',  // Cambia a la ruta correcta
      autoplay: true,
      loop: true
    };
  }
}
