import { CommonModule } from '@angular/common';
import { Component, Input, CUSTOM_ELEMENTS_SCHEMA, Output, EventEmitter } from '@angular/core';

interface ColumnConfig {
  index: number;
  maxWidth?: string;
  truncate?: boolean;
  align?: 'left' | 'center' | 'right';
}

@Component({
  selector: 'app-tabla-compartida',
  standalone: true,
  imports: [CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './tabla-compartida.component.html',
  styleUrl: './tabla-compartida.component.css'
})
export class TablaCompartidaComponent {

  @Input() headers: string[] = []; // Cambiado a string[] para mayor flexibilidad
  @Input() datas: any[] = []; // Cambiado a any[] para mayor flexibilidad
  @Input() accion: boolean = false; // Muestra o no el botón de acción
  @Input() dataKeys: string[] = [];

  // NUEVA ENTRADA para configurar columnas específicas
  @Input() columnConfig: ColumnConfig[] = [];

  @Output() editar = new EventEmitter<any>();
  @Output() eliminar = new EventEmitter<any>();

  onEditar(dato: any) {
    this.editar.emit(dato);
  }
  onEliminar(dato: any) {
    this.eliminar.emit(dato);
  }

  // Métodos simples para cada cosa
  getAncho(index: number): string {
    const config = this.columnConfig.find(c => c.index === index);
    return config?.maxWidth || 'auto';
  }

  deberTruncar(index: number): boolean {
    const config = this.columnConfig.find(c => c.index === index);
    return config?.truncate || false;
  }
  
}
