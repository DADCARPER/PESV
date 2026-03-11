import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-card-dashboard',
  standalone: true,
  imports: [CommonModule,RouterModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './card-dashboard.component.html',
  styleUrl: './card-dashboard.component.css'
})
export class CardDashboardComponent {

  @Input() titulo = ""
  @Input() valor = ""
  @Input() colorIcono = ""
  @Input() iconClass = ""
  @Input() routerLink = ""
  @Input() tabNumber?: number // ← Nuevo input para el número de tab OPCIONAL EN CASO DE NECESITAR TAB IMPORTANTE USARO SOLO 1 O RAOUTER LINK O TAB
  @Output() tabClick = new EventEmitter<number>() // ← Nuevo output

  onCardClick() {
      if (this.tabNumber) {
          this.tabClick.emit(this.tabNumber);
      }
  }

}
