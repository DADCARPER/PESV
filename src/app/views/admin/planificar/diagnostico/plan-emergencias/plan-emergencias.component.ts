import { CommonModule } from '@angular/common';
import { textoSeguro } from '../../../../../data/texto-seguro';
import { Component, OnInit, OnChanges, SimpleChanges, CUSTOM_ELEMENTS_SCHEMA, Input, viewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AgGridModule } from 'ag-grid-angular';
import { ColDef, GridApi, GridReadyEvent } from 'ag-grid-community';
import { Form1PlanEmergenciasComponent } from './form1-plan-emergencias/form1-plan-emergencias.component';
import { DiagnosticoDatosService } from '../../../../../services/shared/diagnostico-datos.service';
import { Models } from '../../../../../interfaces/models';
import { celdaVigencia } from '../../../../../data/vigencias';
import { FirestoreService } from '../../../../../services/shared/firestore.service';
import { AlertaService } from '../../../../../services/shared/alerta.service';

@Component({
  selector: 'app-plan-emergencias',
  standalone: true,
  imports: [CommonModule, FormsModule, AgGridModule, Form1PlanEmergenciasComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './plan-emergencias.component.html',
  styleUrl: './plan-emergencias.component.css'
})
export class PlanEmergenciasComponent implements OnInit, OnChanges {

  private _firestore = inject(FirestoreService);
  private _datos = inject(DiagnosticoDatosService);
  private _alerta = inject(AlertaService);

  modalFormulario = viewChild.required<Form1PlanEmergenciasComponent>('modalFormulario');

  private gridApi!: GridApi;

  searchText = '';
  activeFilter = 'Todos';

  planAEliminar: Models.Diagnostico.PlanEmergencia | null = null;
  eliminando = false;

  filterButtons = [
    { label: 'Todos',                    value: 'Todos' },
    { label: 'Accidente de tránsito',    value: 'Accidente de tránsito' },
    { label: 'Falla mecánica',           value: 'Falla mecánica' },
    { label: 'Emergencia médica',        value: 'Emergencia médica' },
  ];

  @Input() datos: Models.Diagnostico.PlanEmergencia[] = [];
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
      headerName: 'Plan', field: 'nombrePlan', width: 260,
      cellRenderer: (params: any) => `
        <div class="flex flex-col justify-center h-full">
          <div class="font-semibold text-gray-900 text-sm leading-tight">${textoSeguro(params.value)}</div>
          <div class="text-xs text-gray-400 mt-0.5">${textoSeguro(params.data.responsable)}</div>
        </div>`
    },
    {
      headerName: 'Tipo emergencia', field: 'tipoEmergencia', width: 190,
      cellRenderer: (params: any) => {
        const colors: Record<string, string> = {
          'Accidente de tránsito': 'bg-red-100 text-red-700',
          'Falla mecánica':        'bg-amber-100 text-amber-700',
          'Emergencia médica':     'bg-blue-100 text-blue-700',
          'Incendio vehicular':    'bg-orange-100 text-orange-700',
        };
        const cls = colors[params.value] ?? 'bg-gray-100 text-gray-600';
        return `<span class="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${cls}">${textoSeguro(params.value, '—')}</span>`;
      }
    },
    {
      headerName: 'Descripción', field: 'descripcion', width: 260,
      cellRenderer: (params: any) => `<span class="text-xs text-gray-500">${textoSeguro(params.value, '—')}</span>`
    },
    {
      headerName: 'Protocolo', field: 'protocoloAccion', width: 260,
      cellRenderer: (params: any) => params.value
        ? `<span class="text-xs text-gray-600" title="${textoSeguro(params.value)}">${textoSeguro(String(params.value).slice(0, 90))}${String(params.value).length > 90 ? '…' : ''}</span>`
        : `<span class="text-xs text-red-400">Sin definir</span>`,
    },
    { headerName: 'Tel. emergencia', field: 'telefonoEmergencia', width: 130 },
    { headerName: 'Elaborado',       field: 'fechaElaboracion',   width: 120 },
    {
      headerName: 'Próxima revisión', field: 'fechaRevision', width: 150,
      cellRenderer: (params: any) => celdaVigencia(params.value, {
        vencido: 'Sin revisar hace', porVencer: 'Revisar en', vigente: 'Al día',
      }),
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
      filtered = filtered.filter(i => i.tipoEmergencia === this.activeFilter);
    }
    if (this.searchText.trim()) {
      const s = this.searchText.toLowerCase();
      filtered = filtered.filter(i =>
        String(i.nombrePlan      ?? '').toLowerCase().includes(s) ||
        String(i.tipoEmergencia  ?? '').toLowerCase().includes(s) ||
        String(i.responsable     ?? '').toLowerCase().includes(s)
      );
    }
    this.filteredData = filtered;
  }

  onCellClicked(event: any) {
    if (event.colDef.headerName !== 'Acciones') return;
    const target = event.event?.target as HTMLElement;
    if (target?.closest('.btn-editar')) this.modalFormulario().abrirModal('editar', event.data);
    if (target?.closest('.btn-eliminar')) this.planAEliminar = event.data;
  }

  cancelarEliminar() { this.planAEliminar = null; }

  async confirmarEliminar() {
    if (!this.planAEliminar?.id) return;
    this.eliminando = true;
    try {
      await this._firestore.updateDocument(
        `${this._datos.ruta('plan-emergencias')}/${this.planAEliminar.id}`,
        { estado: 'NoActivo' }
      );
      this._alerta.showSuccess('Plan eliminado exitosamente.');
      this.planAEliminar = null;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error al eliminar';
      console.error('[PlanEmergencias] eliminar:', error);
      this._alerta.showError(msg);
    } finally {
      this.eliminando = false;
    }
  }
}
