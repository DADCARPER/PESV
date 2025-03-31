import { Component, OnInit } from '@angular/core';
import { CardsBotonComponent } from "../../../../components/cards/cards-boton/cards-boton.component";
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import AOS from 'aos';

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
    AOS.init();
  }

  async toggleTabs(tabNumber: number,porce:string ) {

    this.openTab = tabNumber;
    setTimeout(() => {
      AOS.refresh();
      
    }, 200);
  }

}
