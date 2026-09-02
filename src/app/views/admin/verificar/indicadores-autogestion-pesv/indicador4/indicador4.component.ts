import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';

import { CardsMedicionTrimestral2Component } from "../../../../../components/cards/cards-medicion-trimestral2/cards-medicion-trimestral2.component";
import { CardsMedicionAnual2Component } from "../../../../../components/cards/cards-medicion-anual2/cards-medicion-anual2.component";

import { FirestoreService } from '../../../../../services/shared/firestore.service';
import { AuthenticacionService } from '../../../../../services/shared/authenticacion.service';
import { ObjetivosMetasService } from '../../../../../services/shared/objetivos-metas.service';
import { Models } from '../../../../../interfaces/models';
import { ModelObjetivosMetas as M } from '../../../../../interfaces/objetivosMetas.interface';

/**
 * IDC4 — Cumplimiento de metas PESV.
 *
 * No captura nada: lee los indicadores definidos en el módulo 007 Objetivos y
 * metas y cuenta cuántos cumplen su meta en cada trimestre.
 */
@Component({
  selector: 'app-indicador4',
  standalone: true,
  imports: [CommonModule, RouterLink, CardsMedicionTrimestral2Component, CardsMedicionAnual2Component],
  templateUrl: './indicador4.component.html',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  styleUrl: './indicador4.component.css'
})
export class Indicador4Component implements OnInit, OnDestroy {

  private _firestore = inject(FirestoreService);
  private _auth = inject(AuthenticacionService);
  private _objetivos = inject(ObjetivosMetasService);

  indicadores = signal<M.ConsultarIndicador[]>([]);
  cargando = signal<boolean>(true);

  anio = this._auth.periodo();

  resumen = computed(() => this._objetivos.cumplimientoMetasPESV(this.indicadores()));

  private sub?: Subscription;

  ngOnInit(): void {
    const q: Models.Firebases.whereQuery[] = [['estado', '==', 'Activo']];
    const extras: Models.Firebases.extrasQuery = { orderParam: 'docCreado', directionSort: 'asc', limit: 200 };

    this.sub = this._firestore
      .getDocumentsQueryChanges<M.ConsultarIndicador>(this._objetivos.ruta('-indicadores'), q, extras)
      .subscribe({
        next: (res) => {
          this.indicadores.set(res);
          this.cargando.set(false);
        },
        error: (error: unknown) => {
          console.error('[Indicador4] consultarIndicadores:', error);
          this.cargando.set(false);
        }
      });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  /**
   * Alcanzadas del trimestre, o null si ese trimestre no tiene ni una medición.
   * La tarjeta pinta «—» en vez de un cero que se leería como incumplimiento.
   */
  alcanzadasTrimestre(indice: number): number | null {
    const r = this.resumen();
    return r.porcentajeTrimestre[indice] === null ? null : r.alcanzadasTrimestre[indice];
  }

}
