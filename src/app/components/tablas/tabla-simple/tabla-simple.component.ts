import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { TableHeader, Integrante } from '../../../interfaces/perfil.interface';

@Component({
  selector: 'app-tabla-simple',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tabla-simple.component.html',
  styleUrl: './tabla-simple.component.css'
})
export class TablaSimpleComponent {

  @Input() integrantes: Integrante[] = [];
  @Input() tableHeaders: TableHeader[] = [];
  @Input() loading: boolean = false;
  @Output() onDelete = new EventEmitter<string>();
  @Output() onEdit = new EventEmitter<Integrante>();

  removeIntegrante(id: string): void {
    this.onDelete.emit(id);
  }

  editIntegrante(integrante: Integrante): void {
    this.onEdit.emit(integrante);
  }

}
