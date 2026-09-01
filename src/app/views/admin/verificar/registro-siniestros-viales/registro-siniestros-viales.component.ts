import { Component, OnInit } from '@angular/core';
import { CardsBotonComponent } from "../../../../components/cards/cards-boton/cards-boton.component";
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
@Component({
  selector: 'app-registro-siniestros-viales',
  standalone: true,
  imports: [CommonModule, RouterLink, CardsBotonComponent],
  templateUrl: './registro-siniestros-viales.component.html',
  styleUrl: './registro-siniestros-viales.component.css'
})
export class RegistroSiniestrosVialesComponent implements OnInit {

  openTab = 0;

  ngOnInit() {
  }

  async toggleTabs(tabNumber: number,porce:string ) {

    this.openTab = tabNumber;
  }

}
