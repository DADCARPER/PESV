import { Injectable, inject } from '@angular/core';
import { FirestoreService } from './firestore.service';
import { UserFirmas } from '../interfaces/perfil.interface';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FirmasService {

  private readonly COLLECTION = 'gestor-firmas';
    public _firestore = inject(FirestoreService);
  
    //Llamo los datos del Docuemtno usres/uid
    async getPerfilEdit(uid: string): Promise<UserFirmas> { 
  
      const ruta = `${this.COLLECTION}/${uid}`;
      return await this._firestore.getDocument(ruta) as UserFirmas;
    }
    // Actualizo los datos del Docuemtno 
    async updateFirma(uid: string, data: UserFirmas) {
  
      const ruta = `${this.COLLECTION}/${uid}`;
      return await this._firestore.setDocument(ruta, data);
    }
  
    // Llamo los datos del perfil en tiempo real
    // El [] indica que es un array de UserFirmas
    getPerfilRealTime(uid: string): Observable<UserFirmas[]> {
  
      return this._firestore.getDocumentRealTime(`${this.COLLECTION}/`, uid);
  
    }
}
