import { CommonModule } from '@angular/common';
import { textoSeguro } from '../../../../../data/texto-seguro';
import { Component, OnInit, OnChanges, SimpleChanges, CUSTOM_ELEMENTS_SCHEMA, Input, viewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AgGridModule } from 'ag-grid-angular';
import { ColDef, GridApi, GridReadyEvent } from 'ag-grid-community';
import { Form1RutasComponent } from './form1-rutas/form1-rutas.component';
import { DiagnosticoDatosService } from '../../../../../services/shared/diagnostico-datos.service';
import { Models } from '../../../../../interfaces/models';
import { kilometrosAlMes } from '../../../../../data/rutas';
import { FirestoreService } from '../../../../../services/shared/firestore.service';
import { AlertaService } from '../../../../../services/shared/alerta.service';

@Component({
  selector: 'app-rutas-frecuentes',
  standalone: true,
  imports: [CommonModule, FormsModule, AgGridModule, Form1RutasComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './rutas-frecuentes.component.html',
  styleUrl: './rutas-frecuentes.component.css'
})
export class RutasFrecuentesComponent implements OnInit, OnChanges {

  private _firestore = inject(FirestoreService);
  private _datos = inject(DiagnosticoDatosService);
  private _alerta = inject(AlertaService);

  modalFormulario = viewChild.required<Form1RutasComponent>('modalFormulario');

  private gridApi!: GridApi;

  searchText = '';
  activeFilter = 'Todos';

  rutaAEliminar: Models.Diagnostico.Ruta | null = null;
  eliminando = false;

  filterButtons = [
    { label: 'Todos',      value: 'Todos'     },
    { label: 'Urbana',     value: 'Urbana'    },
    { label: 'Rural',      value: 'Rural'     },
    { label: 'Autopista',  value: 'Autopista' },
    { label: 'Mixta',      value: 'Mixta'     },
  ];

  @Input() datos: Models.Diagnostico.Ruta[] = [];
  filteredData: any[] = [];

  columnDefs: ColDef[] = [
    {
      headerName: 'Acciones', width: 105, pinned: 'left', sortable: false, resizable: false,
      cellRenderer: () => `
        <div class="flex gap-1 h-full items-center justify-center">
          <button class="btn-editar flex items-center gap-1 px-2 py-1 bg-amber-500 text-white text-xs rounded hover:bg-amber-600 transition-colors">
            <svg class="pointer-events-none" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Editar
          </button>
          <button class="btn-eliminar flex items-center px-2 py-1 border border-red-300 text-red-500 text-xs rounded hover:bg-red-50 transition-colors">
            <svg class="pointer-events-none" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
          </button>
        </div>`
    },
    {
      headerName: 'Ruta', field: 'nombreRuta', width: 220,
      cellRenderer: (params: any) => `
        <div class="flex flex-col justify-center h-full">
          <div class="font-semibold text-gray-900 text-sm">${textoSeguro(params.value)}</div>
          <div class="text-xs text-gray-400">${textoSeguro(params.data.origen)} → ${textoSeguro(params.data.destino)}</div>
        </div>`
    },
    { headerName: 'Tipo de vía',  field: 'tipoVia',        width: 120 },
    { headerName: 'Frecuencia',   field: 'frecuencia',     width: 120 },
    {
      headerName: 'Distancia',    field: 'distanciaKm',    width: 110, type: 'numericColumn',
      valueFormatter: (p: any) => p.value ? `${p.value} km` : '—'
    },
    {
      headerName: 'Tiempo est.',  field: 'tiempoEstimado', width: 150,
      cellRenderer: (params: any) => `<span class="text-xs text-gray-600">${textoSeguro(params.value, '—')}</span>`
    },
    {
      headerName: 'Km al mes', width: 120, type: 'numericColumn',
      // Sale de la distancia y la frecuencia: es la base de los indicadores
      // del PESV, que se expresan por millon de kilometros recorridos.
      valueGetter: (p: any) => kilometrosAlMes(p.data?.distanciaKm, p.data?.frecuencia),
      valueFormatter: (p: any) => p.value === null || p.value === undefined
        ? '—' : `${Number(p.value).toLocaleString()} km`,
    },
    {
      headerName: 'Riesgos', width: 200,
      valueGetter: (p: any) => (p.data?.factoresRiesgo ?? []).length,
      cellRenderer: (params: any) => {
        const factores: string[] = params.data?.factoresRiesgo ?? [];
        if (!factores.length) return `<span class="text-xs text-gray-300">Sin señalar</span>`;
        const resto = factores.length > 2 ? ` +${factores.length - 2}` : '';
        return `<span class="text-xs text-gray-600" title="${textoSeguro(factores.join(', '))}">`
          + `${textoSeguro(factores.slice(0, 2).join(', '))}${resto}</span>`;
      },
    },
    {
      headerName: 'Observaciones', field: 'observaciones', width: 220,
      cellRenderer: (params: any) => `<span class="text-xs text-gray-500">${textoSeguro(params.value, '—')}</span>`
    },
  ];

  defaultColDef: ColDef = { sortable: true, resizable: true };

  ngOnInit() { this.filteredData = [...this.datos]; }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['datos']) {
      this.filteredData = [...this.datos];
      this.applyFilters();
    }
  }

  onGridReady(params: GridReadyEvent) { this.gridApi = params.api; }

  setFilter(value: string) { this.activeFilter = value; this.applyFilters(); }
  onSearchChange() { this.applyFilters(); }

  private applyFilters() {
    let filtered = [...this.datos];
    if (this.activeFilter !== 'Todos') {
      filtered = filtered.filter(i => i.tipoVia === this.activeFilter);
    }
    if (this.searchText.trim()) {
      const s = this.searchText.toLowerCase();
      filtered = filtered.filter(i =>
        String(i.nombreRuta  ?? '').toLowerCase().includes(s) ||
        String(i.origen      ?? '').toLowerCase().includes(s) ||
        String(i.destino     ?? '').toLowerCase().includes(s)
      );
    }
    this.filteredData = filtered;
  }

  onCellClicked(event: any) {
    if (event.colDef.headerName !== 'Acciones') return;
    const target = event.event?.target as HTMLElement;
    if (target?.closest('.btn-editar')) this.modalFormulario().abrirModal('editar', event.data);
    if (target?.closest('.btn-eliminar')) this.rutaAEliminar = event.data;
  }

  cancelarEliminar() { this.rutaAEliminar = null; }

  async confirmarEliminar() {
    if (!this.rutaAEliminar?.id) return;
    this.eliminando = true;
    try {
      await this._firestore.updateDocument(
        `${this._datos.ruta('rutas')}/${this.rutaAEliminar.id}`,
        { estado: 'NoActivo' }
      );
      this._alerta.showSuccess('Ruta eliminada exitosamente.');
      this.rutaAEliminar = null;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error al eliminar';
      console.error('[RutasFrecuentes] eliminar:', error);
      this._alerta.showError(msg);
    } finally {
      this.eliminando = false;
    }
  }
}
