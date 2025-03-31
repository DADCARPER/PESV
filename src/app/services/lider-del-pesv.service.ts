import { Injectable } from '@angular/core';
import { Firestore, setDoc, getDoc, onSnapshot , doc, updateDoc, arrayUnion } from '@angular/fire/firestore';
import { Storage, ref, uploadBytesResumable, getDownloadURL } from '@angular/fire/storage';
import { Auth } from '@angular/fire/auth'; // Importa Auth para obtener el usuario autenticado
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LiderDelPesvService {

  private collectionName = 'liderDelPesv';

  constructor(private firestore: Firestore, private storage: Storage, private auth: Auth) {} // Añade Auth aquí

  async autoGuardar(data: any, usuarioLogueado: string, tipo: string, estado: number, id_formulario: string): Promise<void> {
    try {
      const userDocRef = doc(this.firestore, `liderDelPesv/${usuarioLogueado}`);
      
      /// Obtener el documento actual
      const userDocSnap = await getDoc(userDocRef);
      const formulariosIndex = userDocSnap.exists() ? userDocSnap.data() || {} : {}; // valido si el Documento existe!!

      // Verifico si entre todos los formularios que tome existe uno especifico = id_formulario
      if (formulariosIndex[id_formulario]) {

        console.log('ppppp',formulariosIndex);
          // Si el formulario ya existe, solo actualiza el campo 'estado'
          await setDoc(
              userDocRef, 
              { [id_formulario]: { estado: estado } }, // IDformulario para insertar los datos
              { merge: true }
          );
          console.log('Estado actualizado en el formulario existente');
      } else {
          // Si el formulario no existe, crea uno nuevo con todos los datos
          const nuevoFormulario = {
              estado: estado,
              fechaCreacion: new Date(),
              tipo: tipo
          };

          await setDoc(
              userDocRef, 
              { [id_formulario]: nuevoFormulario }, //Ruta exacta e inserto un objeto
              { merge: true }
          );
          console.log('Nuevo formulario creado en Firestore');
      }

  
      // Guardar o actualizar el formulario en la subcolección
      const formularioDocRef = doc(this.firestore, `liderDelPesv/${usuarioLogueado}/formularios/${id_formulario}`);
      const formularioDocSnap = await getDoc(formularioDocRef);
      console.log(formularioDocSnap.data());
      await setDoc(formularioDocRef, data, { merge: true });
      console.log('Datos del formulario guardados en Firestore en la subcolección');
    } catch (error) {
      console.error('Error al guardar los datos en Firestore:', error);
    }
  }

  async getfomularioEdit(idformulario: string, usuarioLogueado: string){
    
    const formularioDocEdit = doc(this.firestore, `liderDelPesv/${usuarioLogueado}/formularios/${idformulario}`);
    return await getDoc(formularioDocEdit);
    
  }
  
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
          formulariosIndex: arrayUnion({ formularioId, fechaCreacion: new Date(), tipo: 'Asistente' })
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

  //Método para leer un formulario (Documento)

  async leerdatosformulario(userId: string, formularioID: string){

    try {
      const userDocRef = doc(this.firestore, `liderDelPesv/${userId}/formularios/${formularioID}`);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        console.log('CargoLider:', userData['cargoLider']);
        console.log('Fecha:', userData['fechaDesignacion ']);
        console.log('Grado:', userData['gradoAcademico']);
        console.log('url:', userData['fileUrls']);
        
        // Almacena los datos en sessionStorage si deseas
        //sessionStorage.setItem('empresaData', JSON.stringify(userData));
      } else {
        console.log('No existe el documento para el usuario especificado.');
      }
    } catch (error) {
      console.error('Error al obtener los datos de la empresa:', error);
    }

  }


  //////////////////////////

  //Método para SUBIR documento Blob
  async uploadPdfToFirebase(blob: Blob, usuarioLogueado: string, formularioID: string) {

    let url: string ="";
    const filePath = `uploads/${usuarioLogueado}/001-lider-del-pesv/${formularioID}`;
    const fileRef = ref(this.storage, filePath); // Referencia en Firebase Storage
    const task = uploadBytesResumable(fileRef, blob); // Subida del archivo

    task.on('state_changed',
      (snapshot) => {
        // Calcular y mostrar el progreso
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log(`Progreso de subida: ${progress.toFixed(2)}%`);
      },
      (error) => {
        // Manejar errores
        console.error('Error al subir archivo:', error);
      },
      async () => {
        // Subida completada, obtener URL
        url = await getDownloadURL(fileRef);
        console.log('Archivo disponible en:', url);

        //-----------------------
        //Guardamos en el documentos la url del archivo
        const userDocRef = doc(this.firestore, `liderDelPesv/${usuarioLogueado}`);
          
        /// Obtener el documento actual
        const userDocSnap = await getDoc(userDocRef);
        
        const formulariosIndex = userDocSnap.exists() ? userDocSnap.data() || {} : {};
        
        // Verificar si el formulario ya existe
        if (formulariosIndex[formularioID]) {
            // Si el formulario ya existe, solo actualiza el campo 'estado'
            await setDoc(
                userDocRef,
                { 
                  [formularioID]: { URL: url, nombrePDf: `${formularioID}.pdf`, estado: 100 }, 

                }, //creo dos campos URL Y nombrePDF
                { merge: true } // Garantiza que no se sobrescriba todo el documento
            );
            console.log('Estado actualizado en el formulario existente');
        }else{
          console.log('NOO ENTROSQUI');
        }

        
      }
    );

    


  }

  /// Leer documento index
  // async leerDocumentoIndex(userId: string){

  //   try {
  //     const userDocRef = doc(this.firestore, `liderDelPesv/${userId}`);
  //     const userDocSnap = await getDoc(userDocRef);

  //     if (userDocSnap.exists()) {
  //       const userData = userDocSnap.data();
  //       console.log('Leer Docuemtno INdex',userData);

  //       // Recorrer todas las claves (IDs de formularios) directamente en userData
  //       return Object.keys(userData).map((key) => ({
  //         id: key, // La clave es el ID del documento
  //         ...userData[key] // Desestructuramos para incluir los datos del documento
  //       }));


  //       // console.log('CargoLider:', userData['cargoLider']);
  //       // console.log('Fecha:', userData['fechaDesignacion ']);
  //       // console.log('Grado:', userData['gradoAcademico']);
  //       // console.log('url:', userData['fileUrls']);
        
  //       // Almacena los datos en sessionStorage si deseas
  //       //sessionStorage.setItem('empresaData', JSON.stringify(userData));
  //     } else {
  //       console.log('No existe el documento para el usuario especificado.');
  //       return [];
  //     }
  //   } catch (error) {
  //     console.error('Error al obtener los datos de la empresa:', error);
  //     return [];
  //   }

  // }

  leerDocumentoIndex(userId: string): Observable<any[]> {
    return new Observable<any[]>((observer) => {
      const userDocRef = doc(this.firestore, `liderDelPesv/${userId}`);

      // Escuchar el documento en tiempo real
      const unsubscribe = onSnapshot(
        userDocRef,
        (docSnapshot) => {
          if (docSnapshot.exists()) {
            const userData = docSnapshot.data();
            console.log("datos llamadossssssss",docSnapshot.data());
            const documentos = Object.keys(userData).map((key) => ({
              id: key,
              ...userData[key],
            }))
            .sort((a, b) => a.fechaCreacion.seconds - b.fechaCreacion.seconds); // Ordena por fecha
            observer.next(documentos); // Emitir los datos
          } else {
            observer.next([]); // Emitir un array vacío si no existe el documento
          }
        },
        (error) => {
          console.error('Error al escuchar el documento:', error);
          observer.error(error); // Emitir el error
        }
      );

      // Devuelve la función de limpieza para detener el escucha cuando se desuscriba
      return () => unsubscribe();
    });
  }

  
}
