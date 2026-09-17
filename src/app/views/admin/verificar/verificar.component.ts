import { Component, inject, OnInit } from '@angular/core';
import { CardsMenuComponent } from "../../../components/cards/cards-menu/cards-menu.component";
import { NivelPesvService } from '../../../services/shared/nivel-pesv.service';
import { CommonModule } from '@angular/common';
import { EstatusGeneralService } from '../../../services/shared/estatus-general.service';

@Component({
  selector: 'app-verificar',
  standalone: true,
  imports: [CommonModule,CardsMenuComponent],
  templateUrl: './verificar.component.html',
  styleUrl: './verificar.component.css'
})
export class VerificarComponent implements OnInit {
  private _nivel = inject(NivelPesvService);

  /** ¿Se le exige este paso a la empresa según su nivel PESV? */
  aplica(slug: string): boolean {
    return this._nivel.aplica(slug);
  }


  private _estatusgeneral = inject(EstatusGeneralService);
  estatusGeneral: Record<string, any> = {};

  ngOnInit(): void {
    this._nivel.cargar();
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
