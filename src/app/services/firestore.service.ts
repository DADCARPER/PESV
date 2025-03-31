import { Injectable, inject,signal, computed } from '@angular/core';
import { Firestore, doc, getDoc, setDoc, onSnapshot, collection, getDocs } from '@angular/fire/firestore'; //nueva API modular de Firebase 9+
import { Storage, ref, uploadBytes, uploadBytesResumable, getDownloadURL } from '@angular/fire/storage';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FirestoreService {

  private firestore = inject(Firestore);
  private storage = inject(Storage);

  async getDocument(path: string) {

    const docRef = doc(this.firestore, path);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() || {} : {}; // valido si el Documento existe!!

  }

  async setDocument(path: string, data: any) { // el data debe ser {}
    const docRef = doc(this.firestore, path);
    await setDoc(docRef, data,{ merge: true }) // Garantiza que no se sobrescriba todo el documento;
  }

  async getCollection(path: string) {
    const collectionRef = collection(this.firestore, path);
    const collectionSnapshot = await getDocs(collectionRef);
    return collectionSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); //Mapeamos los datos y agregamos el id
  }
  ////////////INITIALIZE SIGNALS///////////////////////////

  // Creamos un signal privado para almacenar los datos
  private documentSignal = signal<any[]>([]);

  // Creamos un signal computado de solo lectura para exponer los datos
  public readonly documentData = computed(() => this.documentSignal());

  // Método para inicializar la escucha en tiempo real del documento
  initDocumentRealTime(path: string, iduser: string | null): () => void {
    const docRef = doc(this.firestore, path + iduser);

    // Retornamos la función de cleanup (unsubscribe)
    const unsubscribe = onSnapshot(docRef, 
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          // Actualizamos el signal con los nuevos datos
          this.documentSignal.set(this.convertObjectToArray(data));
        } else {
          this.documentSignal.set([]);
        }
      },
      (error) => {
        console.error('Error en tiempo real:', error);
        this.documentSignal.set([]);
      }
    );

    return unsubscribe;
  }

  // Método el cual se llama para obtener el signal de solo lectura
  getDocumentSignal() {
    return this.documentSignal.asReadonly();
  }
  /////////////////////FIN SIGNALS///////////////////////////

  // Método que convierte un objeto en un array (puedes usarlo en otros lugares también)
  convertObjectToArray(object: any): any[] {
    // Si el objeto es un mapa (como el que muestras en el ejemplo)
    return Object.keys(object).map(key => ({
      id: key,
      ...object[key],
    }));
  }

  //////////-------STORAGE--------------------//////////////////////////////

  // Método para subir un archivo a Firebase Storage RETORNO URL DESTINO
  async uploadFile(path: string, file: File): Promise<string> {
    const storageRef = ref(this.storage, path);  // Creamos una referencia en el storage
    await uploadBytes(storageRef, file);  // Subimos el archivo
    const downloadURL = await getDownloadURL(storageRef);  // Obtenemos la URL de descarga
    console.log('Archivo subido correctamente a Storage:', downloadURL);
    return downloadURL;  // Retornamos la URL para usarla después
  }

  // Método para subir un archivo y obtener la URL de descarga
  async uploadFileProgreso(path: string, file: File | Blob, progressCallback?: (progress: number) => void): Promise<string> {
    const storageRef = ref(this.storage, path);  // Creamos una referencia en el storage

    // Usamos uploadBytesResumable para permitir la carga con seguimiento de progreso
    const uploadTask = uploadBytesResumable(storageRef, file);

    // Creamos una promesa para manejar el progreso y obtener la URL de descarga
    return new Promise((resolve, reject) => {
      // Seguimiento del progreso de la carga
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // Calculamos el progreso
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          // Llamamos al callback para pasar el progreso
          if (progressCallback) {
            progressCallback(progress);  // Llamamos al callback para pasar el progreso
          }
        },
        (error) => {
          // En caso de error, rechazamos la promesa
          console.error('Error al cargar el archivo:', error);
          reject(error);
        },
        async () => {
          // Cuando la carga finalice con éxito, obtenemos la URL de descarga
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            console.log('Archivo subido correctamente a Storage:', downloadURL);
            resolve(downloadURL);  // Resolvemos la promesa con la URL
          } catch (error) {
            console.error('Error al obtener la URL de descarga:', error);
            reject(error);
          }
        }
      );
    });
  }

  // Método para obtener la URL de un archivo en Storage
  async getFileURL(path: string): Promise<string> {
    const storageRef = ref(this.storage, path);
    const downloadURL = await getDownloadURL(storageRef);  // Obtenemos la URL de descarga
    return downloadURL;
  }

}
