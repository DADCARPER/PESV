import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { DonutComponent } from '../../../../../components/apexChart/donut/donut.component';
import { ColumnsBarHorizontalComponent, CauseData } from '../../../../../components/apexChart/columns-bar-horizontal/columns-bar-horizontal.component';
import { AuthenticacionService } from '../../../../../services/shared/authenticacion.service';
import { FirestoreService } from '../../../../../services/shared/firestore.service';
import { Models } from '../../../../../interfaces/models';

@Component({
  selector: 'app-emergencias-plan',
  standalone: true,
  imports: [CommonModule, RouterLink, DonutComponent, ColumnsBarHorizontalComponent],
  templateUrl: './emergencias-plan.component.html',
  styleUrl: './emergencias-plan.component.css'
})
export class EmergenciasPlanComponent implements OnInit, OnDestroy {

  private _auth = inject(AuthenticacionService);
  private _firestore = inject(FirestoreService);

  planes: any[] = [];
  cargando = true;

  // Gráfica 1: por tipo de emergencia
  tipoLabels: string[] = [];
  tipoSeries: number[] = [];
  tipoData: CauseData[] = [];

  // Gráfica 2: planes con protocolo documentado vs sin protocolo
  protocoloLabels: string[] = [];
  protocoloSeries: number[] = [];

  // Gráfica 3: planes con fecha de revisión vs sin programar
  revisionLabels: string[] = [];
  revisionSeries: number[] = [];

  // Stats
  totalPlanes = 0;
  conProtocolo = 0;
  conRevision = 0;
  responsablesUnicos = 0;

  private _sub?: Subscription;

  ngOnInit() {
    const nit = this._auth.getCurrentUser().displayName;
    const periodo = this._auth.periodo();
    const path = `Empresas/${nit}/periodos/${periodo}/006-diagnostico-plan-emergencias`;
    const q: Models.Firebases.whereQuery[] = [['estado', '==', 'Activo']];

    this._sub = this._firestore
      .getDocumentsQueryChanges<any>(path, q)
      .subscribe(res => {
        this.planes = res;
        this._calcularGraficas(res);
        this.cargando = false;
      });
  }

  private _calcularGraficas(data: any[]) {
    this.totalPlanes = data.length;

    // Gráfica 1: tipo de emergencia
    const porTipo = this._agrupar(data, 'tipoEmergencia');
    this.tipoLabels = Object.keys(porTipo);
    this.tipoSeries = Object.values(porTipo);
    this.tipoData = this.tipoLabels.map((causa, i) => ({ causa, porcentaje: this.tipoSeries[i] }));

    // Gráfica 2: protocolo de acción documentado
    const conProt  = data.filter(p => p.protocoloAccion && p.protocoloAccion.trim() !== '').length;
    const sinProt  = data.length - conProt;
    this.protocoloLabels = ['Con protocolo', 'Sin protocolo'].filter((_, i) => [conProt, sinProt][i] > 0);
    this.protocoloSeries = [conProt, sinProt].filter(v => v > 0);

    // Gráfica 3: fecha de revisión programada
    const conRev = data.filter(p => p.fechaRevision && p.fechaRevision.trim() !== '').length;
    const sinRev = data.length - conRev;
    this.revisionLabels = ['Con fecha revisión', 'Sin programar'].filter((_, i) => [conRev, sinRev][i] > 0);
    this.revisionSeries = [conRev, sinRev].filter(v => v > 0);

    // Stats
    this.conProtocolo = conProt;
    this.conRevision  = conRev;
    this.responsablesUnicos = new Set(
      data.map(p => (p.responsable ?? '').trim()).filter(r => r !== '')
    ).size;
  }

  private _agrupar(items: any[], campo: string): Record<string, number> {
    return items.reduce((acc, item) => {
      const key = item[campo] || 'Sin definir';
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  ngOnDestroy() {
    this._sub?.unsubscribe();
  }
}
