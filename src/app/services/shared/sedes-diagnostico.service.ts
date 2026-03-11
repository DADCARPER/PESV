import { Injectable, inject, signal } from '@angular/core';
import { FirestoreService } from './firestore.service';
import { AuthenticacionService } from './authenticacion.service';


@Injectable({
  providedIn: 'root'
})
export class SedesDiagnosticoService {

  private _auth = inject(AuthenticacionService);
  private _firestore = inject(FirestoreService);
  private coleccion = '006-diagnostico';
  private subcoleccion = 'sedes';

  departamentos = signal([]);

  ngOnInit() {

  }

  // Método para actualizar el signal con nuevos datos
  setDepartamentoLocal(data: any) {
    this.departamentos.set(data);
  }

  // Método para obtener el valor actual del signal
  getDepartamentoLocal() {
    return this.departamentos();
  }


  async setDepartamentoFirestore(data: any) {
    try {
      const userId = this._auth.userIdSignal();
      const nombreDocumento = new Date().getTime();
      const doc = await this._firestore.updateDocument(`${this.coleccion}/${userId}/${this.subcoleccion}/${nombreDocumento}`, data);
      return doc;
    } catch (error) {
      console.error('Error al obtener el estatus general', error);
      return null;
    }
  }

  // Método para obtener el 1 documento de Firestore
  async getDepartamentoFirestore() {
    try {
      const userId = this._auth.userIdSignal();
      const snap = await this._firestore.getDocument<any>(`${this.coleccion}/${userId}/${this.subcoleccion}/sedes`);
      return snap.data() ?? {};
    } catch (error) {
      console.error('Error al obtener el estatus general', error);
      return null;
    }
  }
  // Método para obtener la colección de Firestore varios documentos ya en un array
  async getCollectionDepartamentoFirestore() {
    try {
      const userId = this._auth.userIdSignal();
      const snap = await this._firestore.getDocuments<any>(`${this.coleccion}/${userId}/${this.subcoleccion}`);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (error) {
      console.error('Error al obtener el estatus general', error);
      return null;
    }
  }

}
