import { Injectable, inject } from '@angular/core';
import { FirestoreService } from './firestore.service';
import { UserProfile } from '../interfaces/perfil.interface';
import { LoginService } from './login.service';

@Injectable({
  providedIn: 'root'
})
export class PerfilService {

  private readonly COLLECTION = 'users';
  private _loginservice = inject(LoginService);
  public _firestore = inject(FirestoreService);

  //Llamo los datos del perfil Docuemtno usres/uid
  async getPerfilEdit(): Promise<UserProfile> { 

    const ruta = `${this.COLLECTION}/${this._loginservice.userIdSignal()}`;
    return await this._firestore.getDocument(ruta) as UserProfile;
  }
  // Actualizo los datos del perfil Docuemtno usres/uid
  async updatePerfil(data: UserProfile) {

    const ruta = `${this.COLLECTION}/${this._loginservice.userIdSignal()}`;
    return await this._firestore.setDocument(ruta, data);
  }

  // Llamo los datos del perfil en tiempo real
  // El [] indica que es un array de UserProfile
  // getPerfilRealTime(uid: string): Observable<UserProfile[]> {

  //   return this._firestore.getDocumentRealTime(`${this.COLLECTION}/`, uid);

  // }

}
