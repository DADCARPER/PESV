import { Component, OnInit } from '@angular/core';
import { CardsBotonComponent } from "../../../../components/cards/cards-boton/cards-boton.component";
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import AOS from 'aos'; // Importa AOS

@Component({
  selector: 'app-gestion-cambio-contratistas',
  standalone: true,
  imports: [CommonModule, RouterLink, CardsBotonComponent],
  templateUrl: './gestion-cambio-contratistas.component.html',
  styleUrl: './gestion-cambio-contratistas.component.css'
})
export class GestionCambioContratistasComponent implements OnInit {

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
