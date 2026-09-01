import { Component,OnInit } from '@angular/core';
import { CardsBotonComponent } from "../../../../components/cards/cards-boton/cards-boton.component";
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
@Component({
  selector: 'app-planificacion-desplazamientos-laborales',
  standalone: true,
  imports: [CommonModule,RouterLink,CardsBotonComponent],
  templateUrl: './planificacion-desplazamientos-laborales.component.html',
  styleUrl: './planificacion-desplazamientos-laborales.component.css'
})
export class PlanificacionDesplazamientosLaboralesComponent implements OnInit {

  openTab = 0;

  ngOnInit() {
  }

  async toggleTabs(tabNumber: number,porce:string ) {

    this.openTab = tabNumber;
  }

}
