import { Injectable, inject } from '@angular/core';
import { FirestoreService } from './firestore.service';
import { Archivos } from '../interfaces/perfil.interface';

@Injectable({
  providedIn: 'root'
})
export class ComiteSeguridadService {

  private readonly COLLECTION = 'comiteSeguridadVial';
      public _firestore = inject(FirestoreService);
    
      //Llamo los datos del Docuemtno 
      async getDocDiagnostico(uid: string): Promise<Archivos> { 
    
        const ruta = `${this.COLLECTION}/${uid}`;
        return await this._firestore.getDocument(ruta) as Archivos;
      }
      // Actualizo los datos del Docuemtno 
      async updateDocDiagnostico(uid: string, data: Archivos) {
    
        const ruta = `${this.COLLECTION}/${uid}`;
        return await this._firestore.setDocument(ruta, data);
      }
  
      ////////////initialize signals///////////////////////////
  
      // Método para inicializar la escucha
      initDiagnosticoRealTime(uid: string): () => void {
        return this._firestore.initDocumentRealTime(`${this.COLLECTION}/`, uid);
      }
  
      // Método para obtener el valor signal es un array[] de Archivos
      getDiagnosticoSignal() {
        return this._firestore.getDocumentSignal();
      }
      ////////////fin signals///////////////////////////
}
