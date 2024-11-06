import { Injectable } from '@angular/core';
import { Firestore, setDoc, addDoc, doc, updateDoc, arrayUnion } from '@angular/fire/firestore';
import { Storage, ref, uploadBytesResumable, getDownloadURL } from '@angular/fire/storage';
import { Auth } from '@angular/fire/auth'; // Importa Auth para obtener el usuario autenticado
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LiderDelPesvService {
  private collectionName = 'liderDelPesv';

  constructor(private firestore: Firestore, private storage: Storage, private auth: Auth) {} // Añade Auth aquí

  // Método para guardar los datos del formulario en Firestore
  async saveLiderData(data: any, usuarioLogueado: string, formularioId: string): Promise<void> {
    try {
      const userDocRef = doc(this.firestore, `liderDelPesv/${usuarioLogueado}`);
      
      // Paso 1: Actualizar el documento principal con la fecha de creación y el índice de formularios
      await setDoc(
        userDocRef,
        {
          //fechaCreacion: new Date(),
          // Agrega un índice de formularios que contiene el ID y la fecha de cada formulario
          formulariosIndex: arrayUnion({ formularioId, fechaCreacion: new Date() })
        },
        { merge: true }
      );
      console.log('Documento principal actualizado con índice de formularios en Firestore');

      // Paso 2: Crear el documento en la subcolección 'formularios' con los datos del formulario
      const formularioDocRef = doc(this.firestore, `liderDelPesv/${usuarioLogueado}/formularios/${formularioId}`);
      await setDoc(formularioDocRef, data, { merge: true });
      console.log('Datos del formulario guardados en Firestore en la subcolección');
    } catch (error) {
      console.error('Error al guardar los datos en Firestore:', error); // Captura y muestra el error
    }
  }


  // Método para subir un archivo a Firebase Storage y obtener su URL
  uploadFile(file: File, usuarioLogueado: string): Observable<string> {
    const filePath = `uploads/${usuarioLogueado}/001-lider-del-pesv/doc_adjuntos/${file.name}`;
    const fileRef = ref(this.storage, filePath);
    const task = uploadBytesResumable(fileRef, file);

    return new Observable<string>((observer) => {
      task.on(
        'state_changed',
        (snapshot) => {
          // Puedes manejar el progreso de la carga si lo necesitas
        },
        (error) => {
          console.error('Error al subir archivo:', error);
          observer.error(error);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(fileRef);
            observer.next(downloadURL);
            observer.complete();
          } catch (error) {
            console.error('Error al obtener la URL de descarga:', error);
            observer.error(error);
          }
        }
      );
    });
  }

  // Método para actualizar el documento con el array de URLs de archivos
  async updateLiderDataWithFiles( usuarioLogueado: string, formularioId: string, fileUrls: string[]): Promise<void> {
    const documentRef = doc(this.firestore, `liderDelPesv/${usuarioLogueado}/formularios/${formularioId}`);
    await updateDoc(documentRef, { fileUrls });
  }

  //////////////////////////

  //Método para leer documento completo 

}
