import { ChangeDetectorRef, Component, inject, Input  } from '@angular/core';
import { LoginService } from '../../../services/login.service';
import { Storage, ref, uploadBytesResumable, getDownloadURL } from '@angular/fire/storage';
import { Firestore, setDoc, doc, arrayUnion } from '@angular/fire/firestore';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-subir-archivos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './subir-archivos.component.html',
  styleUrl: './subir-archivos.component.css'
})
export class SubirArchivosComponent {

  
  @Input()
  get color(): string {
    return this._color;
  }
  set color(color: string) {
    this._color = color !== 'light' && color !== 'dark' ? 'light' : color;
  }
  private _color = 'light';

  private _auth = inject(LoginService);
  private _storage = inject(Storage);
  private _firestore = inject(Firestore);
  private _cdr = inject(ChangeDetectorRef);


  uploadProgress: number = 0;
  downloadURL: string | null = null;

 

  uploadFile(event: any) {
    const file = event.target.files[0];
    this.uploadProgress = 0; // Reiniciar el progreso cada vez que se selecciona un archivo nuevo
    //this._cdr.detectChanges();  // Forzar la detección de cambios

    const allowedTypes = [
      'application/msword', // Word
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // Word .docx
      'application/vnd.ms-excel', // Excel
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // Excel .xlsx
      'text/plain', // TXT
      'application/pdf', // PDF
      'image/png', // PNG
      'application/vnd.ms-powerpoint', // PowerPoint
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', // PowerPoint .pptx
      'application/zip', // ZIP
      'application/x-zip-compressed' // ZIP comprimido
    ];
  
    if (!allowedTypes.includes(file.type)) {
      console.error('Tipo de archivo no permitido');
      return;
    }
  
    const userId = sessionStorage.getItem('userId');
    const category = 'documents'; // Cambia esta categoría según corresponda
    const filePath = `uploads/${userId}/${category}/${file.name}`;
    const storageRef = ref(this._storage, filePath);
    const uploadTask = uploadBytesResumable(storageRef, file);
  
    uploadTask.on('state_changed', (snapshot) => {
      this.uploadProgress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      //console.log('Progreso de carga:', this.uploadProgress);  // Log para verificar el progreso
      //this._cdr.detectChanges();  // Forzar la detección de cambios
    }, (error) => {
      console.error('Error al subir archivo:', error);
    }, () => {
      getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
        this.downloadURL = downloadURL;
  
        if (userId) {
          const userDocRef = doc(this._firestore, `users/${userId}`);
          setDoc(userDocRef, {
            uploadedFiles: arrayUnion({
              fileName: file.name,
              fileURL: downloadURL,
              category: category,
              fileType: file.type,
              uploadedAt: new Date()
            })
          }, { merge: true }).then(() => {

            console.log('Archivo guardado en Firestore');
            // Opcional: restablecer el progreso después de un tiempo para esconder la barra
            setTimeout(() => {
              this.uploadProgress = 0;  // Resetea el progreso después de guardar
              //console.log('Progreso de carga:', this.uploadProgress);  // Log para verificar el progreso
              this._cdr.detectChanges();  // Forzar la detección de cambios
            }, 2000);  // El tiempo de espera es opcional

          }).catch((error) => {
            console.error('Error al guardar en Firestore:', error);
          });
        } else {
          console.error('Usuario no autenticado');
        }
      });
    });
  }
  


}
