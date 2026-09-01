import { Component, OnInit } from '@angular/core';
import { CardsBotonComponent } from "../../../../components/cards/cards-boton/cards-boton.component";
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
@Component({
  selector: 'app-responsabilidad-comportamiento-seguro',
  standalone: true,
  imports: [CommonModule,RouterLink,CardsBotonComponent],
  templateUrl: './responsabilidad-comportamiento-seguro.component.html',
  styleUrl: './responsabilidad-comportamiento-seguro.component.css'
})
export class ResponsabilidadComportamientoSeguroComponent implements OnInit {

  openTab = 0;

  ngOnInit() {
  }

  async toggleTabs(tabNumber: number,porce:string ) {

    this.openTab = tabNumber;
  }


}
