import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { CardsBotonComponent } from "../../../../components/cards/cards-boton/cards-boton.component";
import { Indicador1Component } from "./indicador1/indicador1.component";
import { Indicador2Component } from "./indicador2/indicador2.component";
import { Indicador3Component } from "./indicador3/indicador3.component";
import { Indicador4Component } from "./indicador4/indicador4.component";
import { Indicador5Component } from "./indicador5/indicador5.component";
import { Indicador6Component } from "./indicador6/indicador6.component";
import { Indicador7Component } from "./indicador7/indicador7.component";
import { Indicador8Component } from "./indicador8/indicador8.component";
import { Indicador9Component } from "./indicador9/indicador9.component";
import { Indicador10Component } from "./indicador10/indicador10.component";
import { Indicador11Component } from "./indicador11/indicador11.component";
import { Indicador12Component } from "./indicador12/indicador12.component";
import { Indicador13Component } from "./indicador13/indicador13.component";

const TOTAL_INDICADORES = 13;

@Component({
  selector: 'app-indicadores-autogestion-pesv',
  standalone: true,
  imports: [CommonModule, RouterLink, CardsBotonComponent, Indicador1Component, Indicador2Component, Indicador3Component, Indicador4Component, Indicador5Component, Indicador6Component, Indicador7Component, Indicador8Component, Indicador9Component, Indicador10Component, Indicador11Component, Indicador12Component, Indicador13Component],
  templateUrl: './indicadores-autogestion-pesv.component.html',
  styleUrl: './indicadores-autogestion-pesv.component.css'
})
export class IndicadoresAutogestionPesvComponent implements OnInit, OnDestroy {

  private _ruta = inject(ActivatedRoute);
  private _router = inject(Router);

  openTab = 0;

  private sub?: Subscription;

  /**
   * Permite enlazar un indicador concreto desde otro módulo con `?idc=4`.
   * El parámetro es el número que ve el usuario (1 a 13); la pestaña es su índice.
   */
  ngOnInit() {
    this.sub = this._ruta.queryParamMap.subscribe(params => {
      const idc = Number(params.get('idc'));
      if (Number.isInteger(idc) && idc >= 1 && idc <= TOTAL_INDICADORES) {
        this.openTab = idc - 1;
      }
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  /** Al cambiar de pestaña se refleja en la URL, para poder compartirla. */
  async toggleTabs(tabNumber: number, porce?: string) {
    this.openTab = tabNumber;
    await this._router.navigate([], {
      relativeTo: this._ruta,
      queryParams: { idc: tabNumber + 1 },
      replaceUrl: true,
    });
  }
}
