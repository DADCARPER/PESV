import { Component, OnInit } from '@angular/core';
import { CardsBotonComponent } from "../../../../components/cards/cards-boton/cards-boton.component";
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
@Component({
  selector: 'app-archivo-retencion-documental',
  standalone: true,
  imports: [CommonModule, RouterLink, CardsBotonComponent],
  templateUrl: './archivo-retencion-documental.component.html',
  styleUrl: './archivo-retencion-documental.component.css'
})
export class ArchivoRetencionDocumentalComponent implements OnInit {

  openTab = 0;

  ngOnInit() {
  }

  async toggleTabs(tabNumber: number,porce:string ) {

    this.openTab = tabNumber;
  }

}
