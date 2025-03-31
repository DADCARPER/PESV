import { Component,OnInit } from '@angular/core';
import { CardsBotonComponent } from "../../../../components/cards/cards-boton/cards-boton.component";
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import AOS from 'aos'; // Importa AOS

@Component({
  selector: 'app-competencias-plan-anual-formacion',
  standalone: true,
  imports: [CommonModule,RouterLink,CardsBotonComponent],
  templateUrl: './competencias-plan-anual-formacion.component.html',
  styleUrl: './competencias-plan-anual-formacion.component.css'
})
export class CompetenciasPlanAnualFormacionComponent implements OnInit {

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
