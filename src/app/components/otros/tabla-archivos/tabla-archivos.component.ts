import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { TableDropdownComponent } from "../../dropdowns/table-dropdown/table-dropdown.component";
import { ArchivoService, CategoriaAgrupada } from '../../../services/archivos.service'; // Asegúrate de importar bien tu servicio
import { InfoIconComponent } from '../../modals/info-icon/info-icon.component';
import { ModalsGuiaComponent } from "../../modals/modals-guia/modals-guia.component";

@Component({
  selector: 'app-tabla-archivos',
  standalone: true,
  imports: [CommonModule, TableDropdownComponent, InfoIconComponent, ModalsGuiaComponent],
  templateUrl: './tabla-archivos.component.html',
  styleUrl: './tabla-archivos.component.css'
})
export class TablaArchivosComponent {
  @Input() color: string = 'light'; // Definido de forma simple

  private archivoService = inject(ArchivoService);
  archivos: CategoriaAgrupada[] = []; // Aquí cargaremos los archivos filtrados y agrupados

  async ngOnInit() {
    try {
      this.archivos = await this.archivoService.getArchivosUsuarioLogueado(); // Cargar archivos desde el servicio
      console.log(this.archivos);  // Para depuración
    } catch (error) {
      console.error('Error al cargar archivos: ', error);
    }
  }
}
