import { Component, OnInit } from '@angular/core';
import { CardsBotonComponent } from "../../../../components/cards/cards-boton/cards-boton.component";
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
@Component({
  selector: 'app-vias-seguras-administadas-organizacion',
  standalone: true,
  imports: [CommonModule,RouterLink,CardsBotonComponent],
  templateUrl: './vias-seguras-administadas-organizacion.component.html',
  styleUrl: './vias-seguras-administadas-organizacion.component.css'
})
export class ViasSegurasAdministadasOrganizacionComponent implements OnInit {

  openTab = 0;

  ngOnInit() {
  }

  async toggleTabs(tabNumber: number,porce:string ) {

    this.openTab = tabNumber;
  }

}
