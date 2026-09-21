import { CommonModule } from '@angular/common';
import { textoSeguro } from '../../../../../data/texto-seguro';
import { Component, OnInit, OnChanges, SimpleChanges, CUSTOM_ELEMENTS_SCHEMA, Input, viewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AgGridModule } from 'ag-grid-angular';
import { ColDef, GridApi, GridReadyEvent } from 'ag-grid-community';
import { Form1ContratistasComponent } from './form1-contratistas/form1-contratistas.component';
import { FirestoreService } from '../../../../../services/shared/firestore.service';
import { DiagnosticoDatosService } from '../../../../../services/shared/diagnostico-datos.service';
import { AlertaService } from '../../../../../services/shared/alerta.service';
import { Models } from '../../../../../interfaces/models';

@Component({
  selector: 'app-contratistas',
  standalone: true,
  imports: [CommonModule, FormsModule, AgGridModule, Form1ContratistasComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './contratistas.component.html',
  styleUrl: './contratistas.component.css'
})
export class ContratistasComponent implements OnInit, OnChanges {

  private _firestore = inject(FirestoreService);
  private _datos = inject(DiagnosticoDatosService);
  private _alerta = inject(AlertaService);

  modalFormulario = viewChild.required<Form1ContratistasComponent>('modalFormulario');

  private gridApi!: GridApi;

  searchText  = '';
  activeFilter = 'Todos';

  contratistaAEliminar: Models.Diagnostico.Contratistas | null = null;
  eliminando = false;

  filterButtons = [
    { label: 'Todos',                    value: 'Todos' },
    { label: 'Con desplazamientos',      value: 'SI'    },
    { label: 'Sin desplazamientos',      value: 'NO'    },
  ];

  @Input() datos: Models.Diagnostico.Contratistas[] = [];
  filteredData: Models.Diagnostico.Contratistas[] = [];

  columnDefs: ColDef[] = [
    {
      headerName: 'Acciones',
      width: 105,
      pinned: 'left',
      sortable: false,
      resizable: false,
      cellRenderer: () => `
        <div class="flex gap-1 h-full items-center justify-center">
          <button class="btn-editar flex items-center gap-1 px-2 py-1 bg-amber-500 text-white text-xs rounded hover:bg-amber-600 transition-colors">
            <svg class="pointer-events-none" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Editar
          </button>
          <button class="btn-eliminar flex items-center px-2 py-1 border border-red-300 text-red-500 text-xs rounded hover:bg-red-50 transition-colors">
            <svg class="pointer-events-none" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
          </button>
        </div>
      `
    },
    {
      headerName: 'Contratista',
      field: 'nombreRazonSocial',
      width: 260,
      cellRenderer: (params: any) => `
        <div class="grid grid-cols-[auto_1fr] gap-3 items-center h-full">
          <div class="w-8 h-8 bg-amber-500 text-white rounded-full grid place-items-center text-sm font-semibold flex-shrink-0">
            ${(params.value ?? '?').split(' ').map((n: string) => n[0] ?? '').join('').substring(0, 2).toUpperCase()}
          </div>
          <div>
            <div class="font-semibold text-gray-900 text-sm leading-tight">${textoSeguro(params.value)}</div>
            <div class="text-xs text-gray-400">${textoSeguro(params.data.nitCedula)} · ${textoSeguro(params.data.tipoPersona)}</div>
          </div>
        </div>
      `
    },
    { headerName: 'Tipo',        field: 'tipoContratista', width: 160 },
    { headerName: 'Vinculación', field: 'tipoVinculacion', width: 160 },
    { headerName: 'Servicio prestado', field: 'servicioPrestado', width: 220 },
    {
      headerName: 'Contrato',
      width: 180,
      cellRenderer: (params: any) => {
        const inicio = params.data.fechaInicioContrato ?? '—';
        const fin    = params.data.contratoIndefinido
          ? '<span class="text-xs bg-blue-100 text-blue-600 px-1 rounded">Indefinido</span>'
          : (params.data.fechaFinContrato ?? '—');
        return `<div class="text-xs leading-5"><div>Inicio: ${inicio}</div><div>Fin: ${fin}</div></div>`;
      }
    },
    {
      headerName: 'Desplazamientos',
      field: 'realizaDesplazamientos',
      width: 130,
      cellRenderer: (params: any) => params.value === 'SI'
        ? `<span class="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-medium px-2 py-0.5 rounded-full">Sí</span>`
        : `<span class="inline-flex items-center gap-1 bg-gray-100 text-gray-500 text-xs font-medium px-2 py-0.5 rounded-full">No</span>`
    },
    {
      headerName: 'Flota',
      width: 160,
      cellRenderer: (params: any) => {
        if (params.data.realizaDesplazamientos !== 'SI') return `<span class="text-gray-300 text-xs">—</span>`;
        return `
          <div class="text-xs leading-5">
            <div>${textoSeguro(params.data.tipoFlota, '—')}</div>
            <div class="text-gray-400">🚚 ${textoSeguro(params.data.vehiculos, '0')} · 👤 ${textoSeguro(params.data.conductores, '0')}</div>
          </div>
        `;
      }
    },
  ];

  defaultColDef: ColDef = { sortable: true, resizable: true };

  ngOnInit() {
    this.filteredData = [...this.datos];
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['datos']) {
      this.filteredData = [...this.datos];
      this.applyFilters();
    }
  }

  onGridReady(params: GridReadyEvent) {
    this.gridApi = params.api;
  }

  setFilter(value: string) {
    this.activeFilter = value;
    this.applyFilters();
  }

  onSearchChange() {
    this.applyFilters();
  }

  private applyFilters() {
    let filtered = [...this.datos];
    if (this.activeFilter !== 'Todos') {
      filtered = filtered.filter(item => item.realizaDesplazamientos === this.activeFilter);
    }
    if (this.searchText.trim()) {
      const search = this.searchText.toLowerCase();
      filtered = filtered.filter(item =>
        String(item.nombreRazonSocial ?? '').toLowerCase().includes(search) ||
        String(item.nitCedula        ?? '').toLowerCase().includes(search) ||
        String(item.servicioPrestado ?? '').toLowerCase().includes(search) ||
        String(item.tipoVinculacion  ?? '').toLowerCase().includes(search) ||
        String(item.tipoContratista  ?? '').toLowerCase().includes(search)
      );
    }
    this.filteredData = filtered;
  }

  onCellClicked(event: any) {
    if (event.colDef.headerName !== 'Acciones') return;
    const target = event.event?.target as HTMLElement;
    if (target?.closest('.btn-editar')) {
      this.mostrarModalFormulario('editar', event.data);
    }
    if (target?.closest('.btn-eliminar')) {
      this.contratistaAEliminar = event.data;
    }
  }

  mostrarModalFormulario(modo: 'crear' | 'editar', datoaEditar?: any): void {
    this.modalFormulario().abrirModal(modo, datoaEditar);
  }

  cancelarEliminar() {
    this.contratistaAEliminar = null;
  }

  async confirmarEliminar() {
    if (!this.contratistaAEliminar?.id) return;
    this.eliminando = true;
    try {
      // La ruta la resuelve el servicio, que ya sabe de empresa y periodo.
      await this._firestore.updateDocument(
        `${this._datos.ruta('contratistas')}/${this.contratistaAEliminar.id}`,
        { estado: 'NoActivo' }
      );
      this._alerta.showSuccess('Contratista eliminado exitosamente.');
      this.contratistaAEliminar = null;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error al eliminar el contratista';
      console.error('[Contratistas] eliminar:', error);
      this._alerta.showError(msg);
    } finally {
      this.eliminando = false;
    }
  }
}
