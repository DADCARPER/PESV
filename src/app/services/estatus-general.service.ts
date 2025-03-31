import { Injectable, inject, OnInit, signal } from '@angular/core';
import { LoginService } from './login.service';
import { FirestoreService } from './firestore.service';


@Injectable({
  providedIn: 'root'
})
export class EstatusGeneralService implements OnInit {

  private _auth = inject(LoginService);
  private _firestore = inject(FirestoreService);
  private coleccion = 'EstatusGeneral';

  estatusGeneral = signal<any>({});

  constructor() { }

  ngOnInit() {

  }

  // Método para actualizar el signal con nuevos datos
  setEstatusGeneralLocal(data: any) {
    this.estatusGeneral.set(data);
  }

  // Método para obtener el valor actual del signal
  getEstatusGeneralLocal() {
    return this.estatusGeneral();
  }

  async setEstatusGeneralFirestore(data: any) {
    try {
      const userId = this._auth.userIdSignal();
      const doc = await this._firestore.setDocument(`${this.coleccion}/${userId}`, data);
      return doc;
    } catch (error) {
      console.error('Error al obtener el estatus general', error);
      return null;
    }
  }

  async getEstatusGeneralFirestore() {
    try {
      const userId = this._auth.userIdSignal();
      const doc = await this._firestore.getDocument(`${this.coleccion}/${userId}`);
      return doc;
    } catch (error) {
      console.error('Error al obtener el estatus general', error);
      return null;
    }
  }
}
