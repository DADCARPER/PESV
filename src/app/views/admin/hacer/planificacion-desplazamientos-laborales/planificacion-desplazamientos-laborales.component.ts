import { Component,OnInit } from '@angular/core';
import { CardsBotonComponent } from "../../../../components/cards/cards-boton/cards-boton.component";
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import AOS from 'aos';

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
    AOS.init();
  }

  async toggleTabs(tabNumber: number,porce:string ) {

    this.openTab = tabNumber;
    setTimeout(() => {
      AOS.refresh();
      
    }, 200);
  }

}
