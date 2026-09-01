import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { MapaColombiaComponent } from '../../../../../components/apexChart/mapa-colombia/mapa-colombia.component';
import { DonutComponent } from '../../../../../components/apexChart/donut/donut.component';
import { ColumnsBarHorizontalComponent, CauseData } from '../../../../../components/apexChart/columns-bar-horizontal/columns-bar-horizontal.component';
import { ColumnsDatalabelsBarComponent } from '../../../../../components/apexChart/columns-datalabels-bar/columns-datalabels-bar.component';
import { PieMonochromeComponent } from '../../../../../components/apexChart/pie-monochrome/pie-monochrome.component';
import { AuthenticacionService } from '../../../../../services/shared/authenticacion.service';
import { FirestoreService } from '../../../../../services/shared/firestore.service';
import { Models } from '../../../../../interfaces/models';

const CATEGORIAS_SERVICIO = [
  'Transporte de Carga',
  'Transporte de Personal',
  'Logística y Almacenamiento',
  'Mantenimiento Vehicular',
  'Servicios de Seguridad',
  'Servicios Tecnológicos (GPS, Software)',
  'Consultoría y Asesoría',
  'Capacitación y Formación',
  'Otros Servicios',
];

@Component({
  selector: 'app-informacion-organizacion',
  standalone: true,
  imports: [CommonModule, RouterLink, MapaColombiaComponent, DonutComponent, ColumnsBarHorizontalComponent, ColumnsDatalabelsBarComponent, PieMonochromeComponent],
  templateUrl: './informacion-organizacion.component.html',
  styleUrl: './informacion-organizacion.component.css'
})
export class InformacionOrganizacionComponent implements OnInit, OnDestroy {

  private _auth = inject(AuthenticacionService);
  private _firestore = inject(FirestoreService);

  // Sedes
  sedes: Models.Diagnostico.Sedes[] = [];
  departamentos: string[] = [];

  // Servicios
  servicios: Models.Diagnostico.Servicio[] = [];

  // Gráfica 1: por categoría
  categoriaLabels: string[] = [];
  categoriaSeries: number[] = [];
  categoriaData: CauseData[] = [];

  // Gráfica 2: por frecuencia de operación
  frecuenciaLabels: string[] = [];
  frecuenciaSeries: number[] = [];
  readonly frecuenciaColores = ['#fbbf24', '#f59e0b', '#e8930a', '#d97706', '#c86d06', '#b45309'];
  readonly categoriaColores  = ['#fbbf24', '#f59e0b', '#e8930a', '#d97706', '#c86d06'];

  // Gráfica 3: características del servicio
  caracteristicasLabels: string[] = [];
  caracteristicasSeries: number[] = [];

  cargando = true;

  private _subSedes?: Subscription;
  private _subServicios?: Subscription;

  ngOnInit() {
    const nit = this._auth.getCurrentUser().displayName;
    const periodo = this._auth.periodo();
    const q: Models.Firebases.whereQuery[] = [['estado', '==', 'Activo']];

    // Sedes
    this._subSedes = this._firestore
      .getDocumentsQueryChanges<Models.Diagnostico.Sedes>(
        `Empresas/${nit}/periodos/${periodo}/006-diagnostico-sedes`, q
      )
      .subscribe(res => {
        this.sedes = res;
        this.departamentos = [...new Set(res.map(s => s.departamento).filter(d => !!d))];
        this.cargando = false;
      });

    // Servicios
    this._subServicios = this._firestore
      .getDocumentsQueryChanges<Models.Diagnostico.Servicio>(
        `Empresas/${nit}/periodos/${periodo}/006-diagnostico-servicios`, q
      )
      .subscribe(res => {
        this.servicios = res;
        this._calcularGraficas(res);
      });
  }

  private _calcularGraficas(servicios: Models.Diagnostico.Servicio[]) {
    // Gráfica 1: agrupación por categoriaServicio
    const porCategoria = this._agrupar(servicios, 'categoriaServicio');
    this.categoriaLabels = Object.keys(porCategoria);
    this.categoriaSeries = Object.values(porCategoria);
    const total = this.categoriaSeries.reduce((a, b) => a + b, 0);
    this.categoriaData = this.categoriaLabels.map((causa, i) => ({
      causa,
      porcentaje: total > 0 ? parseFloat(((this.categoriaSeries[i] / total) * 100).toFixed(2)) : 0,
      cantidad: this.categoriaSeries[i]
    }));

    // Gráfica 2: agrupación por frecuenciaOperacion
    const porFrecuencia = this._agrupar(servicios, 'frecuenciaOperacion');
    this.frecuenciaLabels = Object.keys(porFrecuencia);
    this.frecuenciaSeries = Object.values(porFrecuencia);

    // Gráfica 3: características del servicio
    const campos: { campo: keyof Models.Diagnostico.Servicio; etiqueta: string }[] = [
      { campo: 'conductores',   etiqueta: 'Conductores'   },
      { campo: 'gps',           etiqueta: 'GPS'           },
      { campo: 'mantenimiento', etiqueta: 'Mantenimiento' },
      { campo: 'monitoreo',     etiqueta: 'Monitoreo'     },
      { campo: 'seguro',        etiqueta: 'Seguro'        },
      { campo: 'soporte',       etiqueta: 'Soporte'       },
    ];
    const activos = campos.filter(({ campo }) =>
      servicios.some(s => s[campo] === true)
    );
    this.caracteristicasLabels = activos.map(c => c.etiqueta);
    this.caracteristicasSeries = activos.map(({ campo }) =>
      servicios.filter(s => s[campo] === true).length
    );
  }


  private _agrupar(items: any[], campo: string): Record<string, number> {
    return items.reduce((acc, item) => {
      const key = item[campo] || 'Sin definir';
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  ngOnDestroy() {
    this._subSedes?.unsubscribe();
    this._subServicios?.unsubscribe();
  }
}
