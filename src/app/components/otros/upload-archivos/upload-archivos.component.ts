import { CommonModule } from '@angular/common';
import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { Storage, ref, uploadBytesResumable, getDownloadURL } from '@angular/fire/storage';
import { Firestore, setDoc, doc, arrayUnion } from '@angular/fire/firestore';


@Component({
  selector: 'app-upload-archivos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './upload-archivos.component.html',
  styleUrl: './upload-archivos.component.css'
})
export class UploadArchivosComponent {

  uploadProgress: number = 0;
  downloadURL: string | null = null;

  private _storage = inject(Storage);
  private _firestore = inject(Firestore);
  private _cdr = inject(ChangeDetectorRef);

  // Método para manejar la subida del archivo
  uploadFile(event: any) {
    const file = event.target.files[0];

    this.uploadProgress = 0; // Reiniciar el progreso cada vez que se selecciona un archivo nuevo

    const allowedTypes = [
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'application/pdf',
      'image/png',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/zip',
      'application/x-zip-compressed'
    ];

    if (!allowedTypes.includes(file.type)) {
      console.error('Tipo de archivo no permitido');
      return;
    }

    const userId = sessionStorage.getItem('userId');
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const timestamp = Date.now(); // Marca de tiempo actual
    const uniqueFileName = `${timestamp}_${cleanFileName}`;
    const filePath = `uploads/${userId}/001-lider-del-pesv/${uniqueFileName}`;
    const storageRef = ref(this._storage, filePath);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed', (snapshot) => {
      this.uploadProgress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
    }, (error) => {
      console.error('Error al subir archivo:', error);
    }, () => {
      getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
        this.downloadURL = downloadURL;
        this._cdr.detectChanges();

          const userDocRef = doc(this._firestore, `liderDelPesv/${userId}`);
          setDoc(
            userDocRef, 
            { [timestamp]: { URL: downloadURL, esto: 100, fechaCreacion: new Date(), nombrePDf: uniqueFileName, tipo: "Cargado" } },
            { merge: true }).then(() => {
            console.log('Archivo guardado en Firestore');
            
          }).catch((error) => {
            console.error('Error al guardar en Firestore:', error);
          });
        

      });
    });
  }

}
