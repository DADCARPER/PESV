import { Injectable, inject } from '@angular/core';
import { FirestoreService } from './firestore.service';
import { UserProfile } from '../../interfaces/perfil.interface';
import { AuthenticacionService } from './authenticacion.service';

@Injectable({
  providedIn: 'root'
})
export class PerfilService {

  private readonly COLLECTION = 'users';
  private _loginservice = inject(AuthenticacionService);
  public _firestore = inject(FirestoreService);

  //Llamo los datos del perfil Docuemtno usres/uid
  async getPerfilEdit(): Promise<UserProfile> {

    const ruta = `${this.COLLECTION}/${this._loginservice.userIdSignal()}`;
    const snap = await this._firestore.getDocument<UserProfile>(ruta);
    return (snap.data() ?? {}) as UserProfile;
  }
  // Actualizo los datos del perfil Docuemtno usres/uid
  async updatePerfil(data: UserProfile) {

    const ruta = `${this.COLLECTION}/${this._loginservice.userIdSignal()}`;
    return await this._firestore.updateDocument(ruta, data);
  }

  // Llamo los datos del perfil en tiempo real
  // El [] indica que es un array de UserProfile
  // getPerfilRealTime(uid: string): Observable<UserProfile[]> {

  //   return this._firestore.getDocumentRealTime(`${this.COLLECTION}/`, uid);

  // }

}
