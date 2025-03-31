import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import AOS from 'aos'; // Importa AOS
import { CardsBotonComponent } from "../../../../components/cards/cards-boton/cards-boton.component";

@Component({
  selector: 'app-plan-anual-trabajo',
  standalone: true,
  imports: [CommonModule, RouterLink, CardsBotonComponent],
  templateUrl: './plan-anual-trabajo.component.html',
  styleUrl: './plan-anual-trabajo.component.css'
})
export class PlanAnualTrabajoComponent implements OnInit {

  openTab = 0;

  ngOnInit() {
    AOS.init(); // Inicializa AOS
  }

  async toggleTabs(tabNumber: number,porce:string ) {

    this.openTab = tabNumber;
    setTimeout(() => {
      AOS.refresh(); // Reinicia AOS para detectar nuevos elementos
      
    }, 200);
  }

}
