import { Injectable, inject, signal, computed } from '@angular/core';
import { FirestoreService } from './firestore.service';
import { Archivos } from '../../interfaces/perfil.interface';

@Injectable({
  providedIn: 'root'
})
export class DiagnosticoService {

  private readonly COLLECTION = '006-diagnostico';
    public _firestore = inject(FirestoreService);

    // Signal local que reemplaza el Signal del servicio raíz eliminado
    private documentSignal = signal<any[]>([]);
    public readonly documentData = computed(() => this.documentSignal());

    //Llamo los datos del Docuemtno
    async getDocDiagnostico(uid: string): Promise<Archivos> {

      const ruta = `${this.COLLECTION}/${uid}`;
      const snap = await this._firestore.getDocument<Archivos>(ruta);
      return (snap.data() ?? {}) as Archivos;
    }
    // Actualizo los datos del Docuemtno
    async updateDocDiagnostico(uid: string, data: Archivos) {

      const ruta = `${this.COLLECTION}/${uid}`;
      return await this._firestore.updateDocument(ruta, data);
    }

    ////////////initialize signals///////////////////////////

    // Método para inicializar la escucha en tiempo real del documento
    initDiagnosticoRealTime(uid: string): () => void {
      const path = `${this.COLLECTION}/${uid}`;
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
