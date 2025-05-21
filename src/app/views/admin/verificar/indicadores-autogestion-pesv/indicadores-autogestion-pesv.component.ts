import { Component, OnInit } from '@angular/core';
import { CardsBotonComponent } from "../../../../components/cards/cards-boton/cards-boton.component";
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import AOS from 'aos';
import { Indicador1Component } from "./indicador1/indicador1.component";
import { Indicador2Component } from "./indicador2/indicador2.component";
import { Indicador3Component } from "./indicador3/indicador3.component";
import { Indicador4Component } from "./indicador4/indicador4.component";
import { Indicador5Component } from "./indicador5/indicador5.component";
import { Indicador6Component } from "./indicador6/indicador6.component";
import { Indicador7Component } from "./indicador7/indicador7.component";
import { Indicador8Component } from "./indicador8/indicador8.component";
import { Indicador9Component } from "./indicador9/indicador9.component";
import { Indicador10Component } from "./indicador10/indicador10.component";
import { Indicador11Component } from "./indicador11/indicador11.component";
import { Indicador12Component } from "./indicador12/indicador12.component";
import { Indicador13Component } from "./indicador13/indicador13.component"; // Importa AOS

@Component({
  selector: 'app-indicadores-autogestion-pesv',
  standalone: true,
  imports: [CommonModule, RouterLink, CardsBotonComponent, Indicador1Component, Indicador2Component, Indicador3Component, Indicador4Component, Indicador5Component, Indicador6Component, Indicador7Component, Indicador8Component, Indicador9Component, Indicador10Component, Indicador11Component, Indicador12Component, Indicador13Component],
  templateUrl: './indicadores-autogestion-pesv.component.html',
  styleUrl: './indicadores-autogestion-pesv.component.css'
})
export class IndicadoresAutogestionPesvComponent implements OnInit {

  openTab = 6;

  ngOnInit() {
    AOS.init(); // Inicializa AOS
  }

  async toggleTabs(tabNumber: number,porce?:string ) {

    this.openTab = tabNumber;
    setTimeout(() => {
      AOS.refresh(); // Reinicia AOS para detectar nuevos elementos
      
    }, 200);
  }

}
