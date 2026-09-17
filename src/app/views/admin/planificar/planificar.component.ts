import { Component, inject, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CardsMenuComponent } from "../../../components/cards/cards-menu/cards-menu.component";
import { NivelPesvService } from '../../../services/shared/nivel-pesv.service';
import { EstatusGeneralService } from '../../../services/shared/estatus-general.service';
import { CommonModule } from '@angular/common';
import { AuthenticacionService } from '../../../services/shared/authenticacion.service';
import { FirestoreService } from '../../../services/shared/firestore.service';
import { StorageService } from '../../../services/shared/storage.service';
import { AlertaService } from '../../../services/shared/alerta.service';
import { Models } from '../../../interfaces/models';

@Component({
  selector: 'app-planificar',
  standalone: true,
  imports: [CommonModule,RouterModule, CardsMenuComponent],
  templateUrl: './planificar.component.html',
  styleUrl: './planificar.component.css'
})
export class PlanificarComponent implements OnInit {
  private _nivel = inject(NivelPesvService);

  /** ¿Se le exige este paso a la empresa según su nivel PESV? */
  aplica(slug: string): boolean {
    return this._nivel.aplica(slug);
  }

  
  private _authcations = inject(AuthenticacionService);
  private _firestore = inject(FirestoreService);
  private _storage = inject(StorageService)
  public _alerta = inject (AlertaService);

  nit = this._authcations.getCurrentUser().displayName; //NIT DE LA EMPRESA ACTUAL
  empresa = this._authcations.getCurrentUser().photoURL; // NOMBRE DE LA EMREPSA
  uid = this._authcations.getCurrentUser().uid; //UID UNICO

  estatusGeneral: Partial<Models.Procesos.ProcesosCarga> = {};

  ngOnInit(): void {
    this._nivel.cargar();
    this.getEstatusgeneral();
  }

  async getEstatusgeneral() {
    const periodoActivo = this._authcations.periodo();
    const path = `EstatusGeneral/${this.nit}`;
    const doc = await this._firestore.getDocument<Models.Procesos.ProcesosCarga>(path);
    if (doc.exists()) {
      const data = doc.data();
      // Solo cargar si el documento pertenece al periodo activo
      if (!data.periodo || data.periodo === periodoActivo) {
        this.estatusGeneral = data;
      }
    }
  }

  

}
