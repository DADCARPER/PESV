import { Component, OnInit } from '@angular/core';
import { CardsBotonComponent } from "../../../../components/cards/cards-boton/cards-boton.component";
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import AOS from 'aos';
import { Indicador1Component } from "./indicador1/indicador1.component"; // Importa AOS

@Component({
  selector: 'app-indicadores-autogestion-pesv',
  standalone: true,
  imports: [CommonModule, RouterLink, CardsBotonComponent, Indicador1Component],
  templateUrl: './indicadores-autogestion-pesv.component.html',
  styleUrl: './indicadores-autogestion-pesv.component.css'
})
export class IndicadoresAutogestionPesvComponent implements OnInit {

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
