import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableDropdownComponent } from '../../dropdowns/table-dropdown/table-dropdown.component';

@Component({
  selector: 'app-card-table',
  standalone: true,
  imports: [CommonModule,TableDropdownComponent],
  templateUrl: './card-table.component.html',
})
export class CardTableComponent implements OnInit {
  @Input()
  get color(): string {
    return this._color;
  }
  set color(color: string) {
    this._color = color !== 'light' && color !== 'dark' ? 'light' : color;
  }
  private _color = 'light';

  constructor() {}

  ngOnInit(): void {}
}
