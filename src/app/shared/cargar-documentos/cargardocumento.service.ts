import { Injectable, inject } from '@angular/core';
import { Archivos } from '../../interfaces/perfil.interface';
import { FirestoreService } from '../../services/firestore.service';
import { LoginService } from '../../services/login.service';

@Injectable({
  providedIn: 'root'
})
export class CargardocumentoService {

  public _firestore = inject(FirestoreService);
  private _uid = inject(LoginService);

  //Llamo los datos del Docuemtno 
  async getDocDiagnostico(collection: string): Promise<Archivos> { 

    const ruta = `${collection}/${this._uid.userIdSignal()}`; 
    return await this._firestore.getDocument(ruta) as Archivos;
  }
  // Actualizo los datos del Docuemtno 
  async updateDocDiagnostico(collection: string, data: Archivos) {

    const ruta = `${collection}/${this._uid.userIdSignal()}`;
    return await this._firestore.setDocument(ruta, data);
  }

  ////////////initialize signals///////////////////////////

  // Método para inicializar la escucha
  initDiagnosticoRealTime(collection: string): () => void {
    return this._firestore.initDocumentRealTime(`${collection}/`, this._uid.userIdSignal());
  }

  // Método para obtener el valor signal es un array[] de Archivos
  getDiagnosticoSignal() {
    return this._firestore.getDocumentSignal();
  }
  ////////////fin signals///////////////////////////

      
}
