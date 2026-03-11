import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterModule } from '@angular/router';


@Component({
  selector: 'app-card-stats2',
  standalone: true,
  imports: [CommonModule,RouterModule],
  templateUrl: './card-stats2.component.html',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  styleUrl: './card-stats2.component.css'
})
export class CardStats2Component {

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
