import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

interface ColumnData {
  header: string
  field: string
}

interface RowData {
  [key: string]: string | number
}

@Component({
  selector: 'app-card-profid',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card-profid.component.html',
  styleUrl: './card-profid.component.css'
})
export class CardProfidComponent {

  @Input() titulo = ""
  @Input() valor = ""
  @Input() colorIcono = ""
  @Input() iconClass = ""
  @Input() columns: ColumnData[] = []
  @Input() datos: RowData[] = []
}
