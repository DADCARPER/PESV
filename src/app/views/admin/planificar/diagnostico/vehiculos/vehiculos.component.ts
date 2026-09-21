import { CommonModule } from '@angular/common';
import { textoSeguro } from '../../../../../data/texto-seguro';
import { Component, OnInit, OnChanges, SimpleChanges, CUSTOM_ELEMENTS_SCHEMA, Input, viewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AgGridModule } from 'ag-grid-angular';
import { ColDef, GridApi, GridReadyEvent } from 'ag-grid-community';
import { Form1VehiculosComponent } from './form1-vehiculos/form1-vehiculos.component';
import { Form2VehiculosComponent } from './form2-vehiculos/form2-vehiculos.component';
import { Form3VehiculosComponent } from './form3-vehiculos/form3-vehiculos.component';
import { DiagnosticoDatosService } from '../../../../../services/shared/diagnostico-datos.service';
import { Models } from '../../../../../interfaces/models';
import { FirestoreService } from '../../../../../services/shared/firestore.service';
import { AlertaService } from '../../../../../services/shared/alerta.service';

/** Con cuantos dias de antelacion se avisa de una vigencia proxima. */
const DIAS_AVISO = 30;

@Component({
  selector: 'app-vehiculos',
  standalone: true,
  imports: [CommonModule, FormsModule, AgGridModule,
    Form1VehiculosComponent, Form2VehiculosComponent, Form3VehiculosComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './vehiculos.component.html',
  styleUrl: './vehiculos.component.css'
})
export class VehiculosComponent implements OnInit, OnChanges {

  private _firestore = inject(FirestoreService);
  private _datos = inject(DiagnosticoDatosService);
  private _alerta = inject(AlertaService);

  modalFormulario  = viewChild.required<Form1VehiculosComponent>('modalFormulario');
  modalDocLegal    = viewChild.required<Form2VehiculosComponent>('modalDocLegal');
  modalOperacion   = viewChild.required<Form3VehiculosComponent>('modalOperacion');

  private gridApi!: GridApi;

  searchText = '';
  activeFilter = 'Todos';

  vehiculoAEliminar: Models.Diagnostico.Vehiculo | null = null;
  eliminando = false;

  filterButtons = [
    { label: 'Todos',              value: 'Todos' },
    { label: 'Propios',            value: 'Propio' },
    { label: 'De terceros',        value: 'Terceros' },
    { label: 'Afiliado',           value: 'Afiliado' },
    { label: 'Asociado',           value: 'Asociado' },
    { label: 'Puesto al servicio', value: 'Puesto al servicio' },
  ];

  @Input() datos: Models.Diagnostico.Vehiculo[] = [];
  filteredData: Models.Diagnostico.Vehiculo[] = [];

  columnDefs: ColDef[] = [
    {
      headerName: 'Acciones', width: 195, pinned: 'left', sortable: false, resizable: false,
      cellRenderer: () => `
        <div class="flex gap-1 h-full items-center justify-center">
          <button title="Editar" class="btn-editar flex items-center gap-1 px-2 py-1 bg-amber-500 text-white text-xs rounded hover:bg-amber-600 transition-colors">
            <svg class="pointer-events-none" xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Editar
          </button>
          <button title="Documentación legal" class="btn-doc-legal flex items-center gap-1 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors">
            <svg class="pointer-events-none" xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline class="pointer-events-none" points="14 2 14 8 20 8"/></svg>
            Docs
          </button>
          <button title="Operación y mantenimiento" class="btn-operacion flex items-center gap-1 px-2 py-1 bg-emerald-500 text-white text-xs rounded hover:bg-emerald-600 transition-colors">
            <svg class="pointer-events-none" xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3" class="pointer-events-none"/><path class="pointer-events-none" d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M18.66 5.34l1.41-1.41"/></svg>
            Oper.
          </button>
          <button title="Eliminar" class="btn-eliminar flex items-center px-2 py-1 border border-red-300 text-red-500 text-xs rounded hover:bg-red-50 transition-colors">
            <svg class="pointer-events-none" xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
          </button>
        </div>`
    },
    {
      headerName: 'Vehículo', field: 'placa', width: 210,
      cellRenderer: (params: any) => {
        // Antes el semaforo solo miraba si el campo estaba relleno, asi que
        // un SOAT caducado en 2023 salia en verde.
        const doc = this.vigencia(params.data.vigenciaSoat);
        const tieneDoc = doc.estado === 'vigente' ? '🟢'
          : doc.estado === 'porVencer' ? '🟡' : '🔴';
        const tieneOp  = params.data.promedioKmMes != null && params.data.promedioKmMes !== '' ? '🟢' : '🔴';
        return `
          <div class="grid grid-cols-[auto_1fr] gap-3 items-center h-full">
            <div class="w-8 h-8 bg-amber-500 text-white rounded-full grid place-items-center text-xs font-bold flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3"/><rect x="9" y="11" width="14" height="10" rx="2"/><circle cx="12" cy="21" r="1"/><circle cx="20" cy="21" r="1"/></svg>
            </div>
            <div>
              <div class="font-bold text-gray-900 text-sm">${textoSeguro(params.value)}</div>
              <div class="text-xs text-gray-400">${textoSeguro(params.data.marca)} ${textoSeguro(params.data.modelo)} · <span title="Docs legales">${tieneDoc}</span><span title="Operación">${tieneOp}</span></div>
            </div>
          </div>`;
      }
    },
    { headerName: 'Tipo',         field: 'tipoVehiculo',     width: 130 },
    { headerName: 'VIN',          field: 'vin',              width: 155 },
    { headerName: 'Motor',        field: 'numeroMotor',      width: 130 },
    { headerName: 'Fabricación',  field: 'fechaFabricacion', width: 120 },
    {
      headerName: 'Kilometraje',  field: 'kilometrajeActual', width: 120, type: 'numericColumn',
      valueFormatter: (p: any) => p.value != null && p.value !== '' ? `${Number(p.value).toLocaleString()} km` : '—'
    },
    {
      headerName: 'Relación', field: 'tipoRelacion', width: 190,
      cellRenderer: (params: any) => {
        // Propio y de terceros se distinguen de un vistazo: son dos regimenes
        // distintos de obligaciones, no dos etiquetas cualesquiera.
        const propio = params.value === 'Propio';
        const color = propio ? 'bg-sky-100 text-sky-800' : 'bg-purple-100 text-purple-800';
        const duenno = propio ? '' : textoSeguro(params.data.contratistaNombre, 'Sin asignar');

        return `
          <div class="leading-tight">
            <span class="inline-block rounded px-1.5 text-[11px] font-medium ${color}">${textoSeguro(params.value, '—')}</span>
            ${duenno ? `<div class="text-xs text-gray-400 truncate">${duenno}</div>` : ''}
          </div>`;
      },
    },
    {
      headerName: 'SOAT',         field: 'vigenciaSoat',     width: 150,
      cellRenderer: (params: any) => this.pintarVigencia(params.value),
    },
    {
      headerName: 'Rev. técnica', field: 'vigenciaRevisionTecnica', width: 150,
      cellRenderer: (params: any) => this.pintarVigencia(params.value),
    },
  ];


  /**
   * En que situacion esta una vigencia.
   *
   * Un SOAT o una revision tecnica caducados dejan al vehiculo sin poder
   * circular, asi que es un hallazgo del diagnostico y no un dato mas. Se
   * avisa tambien de lo que esta por vencer, que es cuando todavia se puede
   * hacer algo.
   *
   * Las fechas se guardan como texto AAAA-MM-DD, que se compara tal cual.
   */
  vigencia(fecha: string | undefined): { estado: 'sinRegistrar' | 'vencido' | 'porVencer' | 'vigente'; dias: number } {
    if (!fecha) return { estado: 'sinRegistrar', dias: 0 };

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const limite = new Date(fecha + 'T00:00:00');
    if (isNaN(limite.getTime())) return { estado: 'sinRegistrar', dias: 0 };

    const dias = Math.round((limite.getTime() - hoy.getTime()) / 86400000);
    if (dias < 0) return { estado: 'vencido', dias };
    if (dias <= DIAS_AVISO) return { estado: 'porVencer', dias };
    return { estado: 'vigente', dias };
  }

  /** La celda de una vigencia: la fecha y en que situacion esta. */
  private pintarVigencia(fecha: string | undefined): string {
    const { estado, dias } = this.vigencia(fecha);

    if (estado === 'sinRegistrar') {
      return `<span class="text-xs text-gray-300">Sin registrar</span>`;
    }

    const aspecto = {
      vencido:   ['bg-red-100 text-red-700', `Vencido hace ${Math.abs(dias)} d.`],
      porVencer: ['bg-amber-100 text-amber-800', `Vence en ${dias} d.`],
      vigente:   ['bg-green-100 text-green-700', 'Vigente'],
    }[estado];

    return `
      <div class="leading-tight">
        <div class="text-xs text-gray-700">${textoSeguro(fecha)}</div>
        <span class="inline-block rounded px-1 text-[10px] font-medium ${aspecto[0]}">${aspecto[1]}</span>
      </div>`;
  }

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
      filtered = this.activeFilter === 'Terceros'
        ? filtered.filter(i => i.tipoRelacion !== 'Propio')
        : filtered.filter(i => i.tipoRelacion === this.activeFilter);
    }
    if (this.searchText.trim()) {
      const s = this.searchText.toLowerCase();
      filtered = filtered.filter(i =>
        String(i.placa        ?? '').toLowerCase().includes(s) ||
        String(i.tipoVehiculo ?? '').toLowerCase().includes(s) ||
        String(i.marca        ?? '').toLowerCase().includes(s) ||
        String(i.vin          ?? '').toLowerCase().includes(s) ||
        String(i.numeroMotor  ?? '').toLowerCase().includes(s) ||
        String(i.tipoRelacion ?? '').toLowerCase().includes(s) ||
        String(i.contratistaNombre ?? '').toLowerCase().includes(s)
      );
    }
    this.filteredData = filtered;
  }

  onCellClicked(event: any) {
    if (event.colDef.headerName !== 'Acciones') return;
    const target = event.event?.target as HTMLElement;
    if (target?.closest('.btn-editar'))    this.modalFormulario().abrirModal('editar', event.data);
    if (target?.closest('.btn-doc-legal')) this.modalDocLegal().abrirModal(event.data);
    if (target?.closest('.btn-operacion')) this.modalOperacion().abrirModal(event.data);
    if (target?.closest('.btn-eliminar'))  this.vehiculoAEliminar = event.data;
  }

  cancelarEliminar() { this.vehiculoAEliminar = null; }

  async confirmarEliminar() {
    if (!this.vehiculoAEliminar?.id) return;
    this.eliminando = true;
    try {
      // La ruta la resuelve el servicio, que ya sabe de empresa y periodo,
      // y al escribir por el se avisa al tablero de que su cifra cambio.
      await this._firestore.updateDocument(
        `${this._datos.ruta('vehiculos')}/${this.vehiculoAEliminar.id}`,
        { estado: 'NoActivo' }
      );
      this._alerta.showSuccess('Vehículo eliminado exitosamente.');
      this.vehiculoAEliminar = null;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error al eliminar';
      console.error('[Vehiculos] eliminar:', error);
      this._alerta.showError(msg);
    } finally {
      this.eliminando = false;
    }
  }
}
