import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { MapaColombiaComponent } from '../../../../../components/apexChart/mapa-colombia/mapa-colombia.component';
import { DonutComponent } from '../../../../../components/apexChart/donut/donut.component';
import { AuthenticacionService } from '../../../../../services/shared/authenticacion.service';
import { FirestoreService } from '../../../../../services/shared/firestore.service';
import { Models } from '../../../../../interfaces/models';

@Component({
  selector: 'app-informacion-organizacion',
  standalone: true,
  imports: [CommonModule, RouterLink, MapaColombiaComponent, DonutComponent],
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

  // Gráfica 2: por cobertura
  coberturaLabels: string[] = [];
  coberturaSeries: number[] = [];

  // Gráfica 3: por frecuencia de operación
  frecuenciaLabels: string[] = [];
  frecuenciaSeries: number[] = [];

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

    // Gráfica 2: agrupación por coberturaOperacion
    const porCobertura = this._agrupar(servicios, 'coberturaOperacion');
    this.coberturaLabels = Object.keys(porCobertura);
    this.coberturaSeries = Object.values(porCobertura);

    // Gráfica 3: agrupación por frecuenciaOperacion
    const porFrecuencia = this._agrupar(servicios, 'frecuenciaOperacion');
    this.frecuenciaLabels = Object.keys(porFrecuencia);
    this.frecuenciaSeries = Object.values(porFrecuencia);
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
