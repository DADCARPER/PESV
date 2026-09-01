import { Component, OnInit } from '@angular/core';
import { CardsBotonComponent } from "../../../../components/cards/cards-boton/cards-boton.component";
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
@Component({
  selector: 'app-auditoria-anual',
  standalone: true,
  imports: [CommonModule, RouterLink, CardsBotonComponent],
  templateUrl: './auditoria-anual.component.html',
  styleUrl: './auditoria-anual.component.css'
})
export class AuditoriaAnualComponent implements OnInit {

  openTab = 0;

  ngOnInit() {
  }

  async toggleTabs(tabNumber: number,porce:string ) {

    this.openTab = tabNumber;
  }

}
