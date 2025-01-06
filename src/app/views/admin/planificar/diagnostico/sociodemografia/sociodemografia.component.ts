import { Component } from '@angular/core';
import { LoadingComponent } from "../../../../../components/loading/loading/loading.component";
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sociodemografia',
  standalone: true,
  imports: [CommonModule,LoadingComponent],
  templateUrl: './sociodemografia.component.html',
  styleUrl: './sociodemografia.component.css'
})
export class SociodemografiaComponent {

  userId: string | null = null;
  isLoading = false; //Al terminar el modulo de ir en true

}
