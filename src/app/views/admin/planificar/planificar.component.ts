import { Component, inject, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CardsMenuComponent } from "../../../components/cards/cards-menu/cards-menu.component";
import { EstatusGeneralService } from '../../../services/estatus-general.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-planificar',
  standalone: true,
  imports: [CommonModule,RouterModule, CardsMenuComponent],
  templateUrl: './planificar.component.html',
  styleUrl: './planificar.component.css'
})
export class PlanificarComponent implements OnInit {

  private _estatusgeneral = inject(EstatusGeneralService);
  estatusGeneral: Record<string, any> = {};

  ngOnInit(): void {
    this.obtenerEstatusGeneral();
  }

  async obtenerEstatusGeneral() {
    const doc = await this._estatusgeneral.getEstatusGeneralFirestore();
    if (doc) {
      // Actualizar el Signal con los datos obtenidos de Firestore
      this.estatusGeneral = doc;  // Almacenar los datos en estatusGeneral
      //console.log('Estatus General:', doc);
    }
  }

  

}
