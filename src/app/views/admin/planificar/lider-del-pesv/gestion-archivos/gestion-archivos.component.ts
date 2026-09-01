import { Component, inject, Input, OnChanges, OnInit, viewChild, SimpleChanges, CUSTOM_ELEMENTS_SCHEMA, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AgGridModule } from 'ag-grid-angular';
import { ColDef, GridApi, GridReadyEvent, Module, ICellRendererParams, ValueFormatterParams } from 'ag-grid-community';
import { F1AddFileComponent } from '../f1-add-file/f1-add-file.component';
import { AuthenticacionService } from '../../../../../services/shared/authenticacion.service';
import { FirestoreService } from '../../../../../services/shared/firestore.service';
import { Models } from '../../../../../interfaces/models';
import { StorageService } from '../../../../../services/shared/storage.service';
import { F2DeleteFileComponent } from '../f2-delete-file/f2-delete-file.component';

@Component({
  selector: 'app-gestion-archivos',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, AgGridModule, F1AddFileComponent, F2DeleteFileComponent],
  schemas:[CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './gestion-archivos.component.html',
  styleUrl: './gestion-archivos.component.css'
})
export class GestionArchivosComponent implements OnInit, OnChanges, OnDestroy {

  modalAgregar = viewChild.required<F1AddFileComponent>('modalAddFile');
  modalEliminar = viewChild.required<F2DeleteFileComponent>('modalDeleteFile');

  private _authcations = inject(AuthenticacionService);
  private _firebaseservice = inject(FirestoreService);
  private _storage = inject(StorageService);

  nit = this._authcations.getCurrentUser().displayName; //NIT DE LA EMPRESA ACTUAL
  empresa = this._authcations.getCurrentUser().photoURL; // NOMBRE DE LA EMREPSA
  uid = this._authcations.getCurrentUser().uid; //UID UNICO

  private suscrip: any;

  private gridApi!: GridApi;
  
  searchText = '';
  activeFilter = 'Todos';

  @Input() datos: any = [];
  
  filteredData: any = [];

  columnDefs: ColDef[] = [
    {
      headerName: 'Archivo',
      field: 'nombre',
      flex: 3, // 50%
      width: 350,
      cellRenderer: (params: ICellRendererParams) => {
        const nombres = params.data?.nombre || 'Sin nombre';
        // Elimina los números y el guion bajo inicial
        let nombre = nombres.replace(/^\d+_/, '');
        const ext = params.data?.extension ? params.data.extension.toLowerCase() : '';
        let icon = '';
        switch (ext) {
          case 'pdf': icon = '<iconify-icon icon="hugeicons:pdf-02" width="24" height="24" class="text-red-600 "></iconify-icon>'; break;
          case 'doc':
          case 'docx': icon = '<iconify-icon icon="hugeicons:doc-02" width="24" height="24" class="text-blue-600 "></iconify-icon>'; break;
          case 'xls':
          case 'xlsx': icon = '<iconify-icon icon="hugeicons:xls-02" width="24" height="24" class="text-green-600 "></iconify-icon>'; break;
          case 'ppt':
          case 'pptx': icon = '<iconify-icon icon="hugeicons:ppt-02" width="24" height="24" class="text-amber-600 "></iconify-icon>'; break;
          case 'jpg':
          case 'jpeg':
          case 'png': icon = '<i class="fas fa-file-image text-yellow-500"></i>'; break;
          default: icon = `<i class='fas fa-file text-gray-400'></i>`;
        }
        return `
          <div class="flex items-center gap-3">
            <span class="text-xl pt-2">${icon}</span>
            <div class="flex flex-col">
              <span class=" text-gray-600 truncate" title="${nombre}">${nombre}</span>
              
            </div>
          </div>
        `;
      }
    },
    {
      headerName: 'Año',
      field: 'anio',
      flex: 1, // Puedes ajustar el tamaño si lo deseas
      minWidth: 80,
      valueGetter: (params: any) => {
        // Extrae el año del timestamp
        if (params.data && params.data.docCreado && params.data.docCreado.seconds) {
          const fecha = new Date(params.data.docCreado.seconds * 1000);
          return fecha.getFullYear();
        }
        return '';
      }
    },
    {
      headerName: 'Peso',
      field: 'pesobytes',
      flex: 1, // 25%
      width: 120,
      cellClass: 'text-right',
      valueFormatter: (params: ValueFormatterParams) => {
        const bytes = params.value || 0;
        if (bytes > 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
        if (bytes > 1024) return (bytes / 1024).toFixed(2) + ' KB';
        return bytes + ' B';
      }
    },
    {
      headerName: 'Acciones',
      field: 'acciones',
      flex: 1, // 25%
      width: 150,
      cellRenderer: (params: ICellRendererParams) => {
        return `
          <div class="flex gap-2">
            <button class="btn-ver p-2 rounded hover:bg-amber-100 text-amber-600 btn-ver" title="Ver archivo">
              <iconify-icon icon="hugeicons:view" width="24" height="24" class="btn-ver"></iconify-icon>
            </button>
            <button class="p-2 rounded hover:bg-amber-100 text-amber-800 btn-descargar" title="Descargar archivo">
              <iconify-icon icon="hugeicons:square-arrow-down-03" width="24" height="24" class="btn-descargar"></iconify-icon>
            </button>
            <button class="p-2 rounded hover:bg-amber-100 text-amber-900 btn-eliminar" title="Eliminar archivo">
              <iconify-icon icon="hugeicons:delete-02" width="24" height="24" class="btn-eliminar"></iconify-icon>
            </button>
          </div>
        `;
      }
    }
  ];

  defaultColDef: ColDef = {
    sortable: true,
    resizable: true
  };


  constructor() { 
    this.consultarDocumentos();
  }

  ngOnInit() {
    this.filteredData = [...this.datos];
  }

  ngOnChanges(changes: SimpleChanges) {
    //console.log("aaaaaaaaaaaaa",this.datos)
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
      filtered = filtered.filter(item => {
        // Extraer año del timestamp
        let year = '';
        if (item.docCreado && item.docCreado.seconds) {
          const fecha = new Date(item.docCreado.seconds * 1000);
          year = fecha.getFullYear().toString();
        }
        // Puedes agregar más formatos si quieres buscar por mes/día
        return (
          item.nombre.toLowerCase().includes(search) ||
          item.extension.toLowerCase().includes(search) ||
          year.includes(search)
        );
      });
    }

    this.filteredData = filtered;
  }


  mostrarModalFormulario(modo: string, datoaEditar?: {}): void { /// paso el dato a editar debe ser opcional ya que solo es en caso de editar
    // this.modalFormulario().abrirModal(modo);
    
  }

  manejarEdicion(dato: any) {
    // Aquí implementas la lógica para editar
    // Por ejemplo, abrir un modal, navegar a otra página, etc.
    //console.log('Donde diocli editar -->>>>', dato);
    this.mostrarModalFormulario("editar",dato);
  }

  manejarEliminar(idDocumento: string){
    this.modalEliminar().abrirModal(idDocumento);
  }

  async onCellClicked(event: any) {
    if (event.colDef.headerName === 'Acciones') {
      // Acción para "Ver Documento"
      const path = event.data.ruta; // Ajusta el nombre del campo según tu modelo
      const nombre = event.data.nombre; // Ajusta el nombre del campo según tu modelo
      const extension = event.data.extension;
      const url = await this._storage.getDownloadURL(path);
      

      if (event.event.target.classList.contains('btn-ver')) {
        // 2. Esta URL es TEMPORAL y PÚBLICA
        const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}`;
        window.open(viewerUrl, '_blank');
        
      }
      if (event.event.target.classList.contains('btn-descargar')) {
        // Acción para "Descargar el documento"
        //console.log("-a<aa----------------------------",url)
        this._storage.downloadFile(path);
      }
      if (event.event.target.classList.contains('btn-eliminar')) {
        // Acción para "Eliminar Documento"
        //console.log("-a<aa----------------------------",event.data.id)
        this.manejarEliminar(event.data.id);
      }
    }
  }
  
  async consultarDocumentos() {
    const path = `Empresas/${this.nit}/documentos`;
    let q: Models.Firebases.whereQuery[];

    q = [['estado', '==', 'Activo']];
  
    const extras: Models.Firebases.extrasQuery = {
      //orderParam: 'docCreado',
      //directionSort: 'desc',
      //limit: 20,
      // group: true
    };

    this.suscrip = this._firebaseservice.getDocumentsQueryChanges<Models.Documentos.Documento>(path, q, extras).subscribe(res => {
      this.datos = res;           // <--- así llenas los datos originales
      this.applyFilters();        // <--- así aplicas los filtros y llenas filteredData
      console.log('res => ', res);
      // this.num_sedes = res.length;
      // this.sedes_total = this.num_sedes.toString();
      // thdatoss = res;

      // Extraer departamentos únicos de las sedes -->> solo se usa para graficar en el mapa
      //this.departamento = [...new Set(res.map(sede => sede.departamento))];
      //console.log('Departamentos:', this.departamento);
    });

  }

  verDocumento(ruta: string) {
    window.open(ruta, '_blank');
  }

  descargarDocumento(ruta: string) {
    // Puedes usar window.open o una petición para forzar la descarga
    window.open(ruta, '_blank');
  }

  ngOnDestroy(){
    this.suscrip.unsubscribe();
  }

}
