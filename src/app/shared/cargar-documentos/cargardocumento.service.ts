import { Injectable, inject, signal, computed } from '@angular/core';
import { Archivos } from '../../interfaces/perfil.interface';
import { FirestoreService } from '../../services/shared/firestore.service';
import { AuthenticacionService } from '../../services/shared/authenticacion.service';

@Injectable({
  providedIn: 'root'
})
export class CargardocumentoService {

  public _firestore = inject(FirestoreService);
  private _uid = inject(AuthenticacionService);

  // Signal local que reemplaza el Signal del servicio raíz
  private documentSignal = signal<any[]>([]);
  public readonly documentData = computed(() => this.documentSignal());

  //Llamo los datos del Docuemtno
  async getDocDiagnostico(collection: string): Promise<Archivos> {

    const ruta = `${collection}/${this._uid.userIdSignal()}`;
    const snap = await this._firestore.getDocument<Archivos>(ruta);
    return (snap.data() ?? {}) as Archivos;
  }
  // Actualizo los datos del Docuemtno
  async updateDocDiagnostico(collection: string, data: Archivos) {

    const ruta = `${collection}/${this._uid.userIdSignal()}`;
    return await this._firestore.updateDocument(ruta, data);
  }

  ////////////initialize signals///////////////////////////

  // Método para inicializar la escucha en tiempo real del documento
  initDiagnosticoRealTime(collection: string): () => void {
    const path = `${collection}/${this._uid.userIdSignal()}`;
    const sub = this._firestore.getDocumentChanges<any>(path).subscribe({
      next: (data) => {
        if (data) {
          this.documentSignal.set(this.convertObjectToArray(data));
        } else {
          this.documentSignal.set([]);
        }
      },
      error: (error) => {
        console.error('Error en tiempo real:', error);
        this.documentSignal.set([]);
      }
    });
    return () => sub.unsubscribe();
  }

  // Método para obtener el signal de solo lectura
  getDiagnosticoSignal() {
    return this.documentSignal.asReadonly();
  }
  ////////////fin signals///////////////////////////

  // Método que convierte un objeto en un array
  private convertObjectToArray(object: any): any[] {
    return Object.keys(object).map(key => ({
      id: key,
      ...object[key],
    }));
  }


}
