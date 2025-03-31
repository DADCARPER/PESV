import { Component, inject, OnInit } from '@angular/core';
import { CardsMenuComponent } from "../../../components/cards/cards-menu/cards-menu.component";
import { CommonModule } from '@angular/common';
import { EstatusGeneralService } from '../../../services/estatus-general.service';

@Component({
  selector: 'app-hacer',
  standalone: true,
  imports: [CommonModule,CardsMenuComponent],
  templateUrl: './hacer.component.html',
  styleUrl: './hacer.component.css'
})
export class HacerComponent implements OnInit {

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
