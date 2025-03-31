import { CommonModule } from '@angular/common';
import { Component, Input, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';


@Component({
  selector: 'app-card-stats2',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card-stats2.component.html',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  styleUrl: './card-stats2.component.css'
})
export class CardStats2Component {

    @Input() titulo = ""
    @Input() valor = ""
    @Input() colorIcono = ""
    @Input() iconClass = ""

}
