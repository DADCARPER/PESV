import { Component, CUSTOM_ELEMENTS_SCHEMA, viewChild, Input, OnInit, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TablaCompartidaComponent } from "../../../../../components/tablas/tabla-compartida/tabla-compartida.component";
import { Form1ColaboradoresComponent } from './form1-colaboradores/form1-colaboradores.component';
import { Form2ColaboradoresComponent } from './form2-colaboradores/form2-colaboradores.component';
import { Form3ImportarExcellComponent } from './form3-importar-excell/form3-importar-excell.component';
import { Models } from '../../../../../interfaces/models';
import { FormsModule } from '@angular/forms';
import { AgGridModule } from 'ag-grid-angular';
import { ColDef, GridApi, GridReadyEvent } from 'ag-grid-community';
import { FirestoreService } from '../../../../../services/shared/firestore.service';
import { AuthenticacionService } from '../../../../../services/shared/authenticacion.service';
import { AlertaService } from '../../../../../services/shared/alerta.service';

@Component({
  selector: 'app-colaboradores',
  standalone: true,
  imports: [CommonModule, TablaCompartidaComponent, Form1ColaboradoresComponent, Form2ColaboradoresComponent, Form3ImportarExcellComponent, FormsModule, AgGridModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './colaboradores.component.html',
  styleUrl: './colaboradores.component.css'
})
export class ColaboradoresComponent implements OnInit, OnChanges {

  private _firestore = inject(FirestoreService);
  private _authcations = inject(AuthenticacionService);
  private _alerta = inject(AlertaService);

  modalFormulario = viewChild.required<Form1ColaboradoresComponent>('modalFormulario');
  modalImportar = viewChild.required<Form3ImportarExcellComponent>('modalImportar');

  private gridApi!: GridApi;

  searchText = '';
  activeFilter = 'Todos';

  // ── Confirmación de eliminación ──────────────────────────────────────────
  colaboradorAEliminar: Models.Diagnostico.Colaboradores | null = null;
  eliminando = false;

  filterButtons = [
    { label: 'Todos', value: 'Todos' },
    { label: 'Diurna', value: 'Diurna' },
    { label: 'Nocturna', value: 'Nocturna' },
    { label: 'Mixta', value: 'Mixta Día - Noche' }
  ];

  @Input() datos: any = [];
  filteredData: any = [];

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
      headerName: 'Colaborador',
      field: 'nombre',
      width: 280,
      cellRenderer: (params: any) => `
        <div class="grid grid-cols-[auto_1fr] gap-3 items-center h-full">
          <div class="w-8 h-8 bg-amber-500 text-white rounded-full grid place-items-center text-sm font-semibold flex-shrink-0">
            ${(params.value ?? '?').split(' ').map((n: string) => n[0] ?? '').join('').substring(0, 2).toUpperCase()}
          </div>
          <div>
            <div class="font-semibold text-gray-900 text-sm leading-tight">${params.value ?? ''}</div>
            <div class="text-xs text-gray-400 truncate">${params.data.email ?? ''}</div>
          </div>
        </div>
      `
    },
    { headerName: 'Documento',      field: 'documento',       width: 120 },
    { headerName: 'Género',         field: 'genero',          width: 90  },
    { headerName: 'F. Nacimiento',  field: 'fechaNacimiento', width: 120 },
    { headerName: 'Escolaridad',    field: 'escolaridad',     width: 110 },
    { headerName: 'Estado Civil',   field: 'estadoCivil',     width: 110 },
    { headerName: 'Estrato',        field: 'estrato',         width: 90  },
    { headerName: 'Jornada',        field: 'jornada',         width: 100 },
    { headerName: 'Cargo',          field: 'cargo',           width: 160 },
    { headerName: 'Área',           field: 'areaDepartamento',width: 140 },
    { headerName: 'Contrato',       field: 'tipoContrato',    width: 120 },
    { headerName: 'Hrs. lab.',      field: 'horasLaborales',  width: 80, type: 'numericColumn' },
    { headerName: 'Experiencia',    field: 'tiempoEmpresa',   width: 100, type: 'numericColumn',
      valueFormatter: (p: any) => `${p.value} años` },
    { headerName: 'Teléfono',       field: 'telefono',        width: 120 },
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

  setFilter(filterValue: string) {
    this.activeFilter = filterValue;
    this.applyFilters();
  }

  onSearchChange() {
    this.applyFilters();
  }

  private applyFilters() {
    let filtered = [...this.datos];
    if (this.activeFilter !== 'Todos') {
      filtered = filtered.filter(item => item.jornada === this.activeFilter);
    }
    if (this.searchText.trim()) {
      const search = this.searchText.toLowerCase();
      filtered = filtered.filter(item =>
        String(item.nombre ?? '').toLowerCase().includes(search) ||
        String(item.documento ?? '').toLowerCase().includes(search) ||
        String(item.email ?? '').toLowerCase().includes(search) ||
        String(item.cargo ?? '').toLowerCase().includes(search) ||
        String(item.areaDepartamento ?? '').toLowerCase().includes(search)
      );
    }
    this.filteredData = filtered;
  }

  onCellClicked(event: any) {
    if (event.colDef.headerName !== 'Acciones') return;
    const target = event.event?.target as HTMLElement;
    if (target?.closest('.btn-editar')) {
      this.modalFormulario().abrirModal('editar', event.data);
    }
    if (target?.closest('.btn-eliminar')) {
      this.colaboradorAEliminar = event.data;
    }
  }

  cancelarEliminar() {
    this.colaboradorAEliminar = null;
  }

  async confirmarEliminar() {
    if (!this.colaboradorAEliminar?.id) return;
    this.eliminando = true;
    const nit = this._authcations.getCurrentUser().displayName;
    const periodo = this._authcations.periodo();
    try {
      await this._firestore.updateDocument(
        `Empresas/${nit}/periodos/${periodo}/006-diagnostico-colaboradores/${this.colaboradorAEliminar.id}`,
        { estado: 'NoActivo' }
      );
      this._alerta.showSuccess('Colaborador eliminado exitosamente.');
      this.colaboradorAEliminar = null;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error al eliminar el colaborador';
      console.error('[Colaboradores] eliminar:', error);
      this._alerta.showError(msg);
    } finally {
      this.eliminando = false;
    }
  }
}
