import { Injectable, inject, signal } from '@angular/core';
import { FirestoreService } from './firestore.service';
import { LoginService } from './login.service';


@Injectable({
  providedIn: 'root'
})
export class SedesDiagnosticoService {

  private _auth = inject(LoginService);
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
      const doc = await this._firestore.setDocument(`${this.coleccion}/${userId}/${this.subcoleccion}/${nombreDocumento}`, data);
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
      const doc = await this._firestore.getDocument(`${this.coleccion}/${userId}/${this.subcoleccion}/sedes`);
      return doc;
    } catch (error) {
      console.error('Error al obtener el estatus general', error);
      return null;
    }
  }
  // Método para obtener la colección de Firestore varios documentos ya en un array
  async getCollectionDepartamentoFirestore() {
    try {
      const userId = this._auth.userIdSignal();
      const doc = await this._firestore.getCollection(`${this.coleccion}/${userId}/${this.subcoleccion}`);
      return doc;
    } catch (error) {
      console.error('Error al obtener el estatus general', error);
      return null;
    }
  }

}
