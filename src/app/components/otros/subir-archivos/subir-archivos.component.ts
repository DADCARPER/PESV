import { ChangeDetectorRef, Component, inject, Input, OnInit } from '@angular/core';
import { LoginService } from '../../../services/login.service';
import { Storage, ref, uploadBytesResumable, getDownloadURL } from '@angular/fire/storage';
import { Firestore, setDoc, doc, arrayUnion } from '@angular/fire/firestore';
import { ArchivoService } from '../../../services/archivos.service'; // Importar el servicio para las categorías
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-subir-archivos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './subir-archivos.component.html',
  styleUrl: './subir-archivos.component.css'
})
export class SubirArchivosComponent implements OnInit {
  
  @Input() color: string = 'light'; // Para manejar el tema de color
  
  private _auth = inject(LoginService);
  private _storage = inject(Storage);
  private _firestore = inject(Firestore);
  private _cdr = inject(ChangeDetectorRef);
  private archivoService = inject(ArchivoService); // Inyectamos el servicio
  
  uploadProgress: number = 0;
  downloadURL: string | null = null;
  category: string = ''; // Categoría seleccionada por el usuario
  categoriasDisponibles: any[] = []; // Categorías filtradas por el nivel del usuario

  async ngOnInit() {
    try {
      const userId = sessionStorage.getItem('userId');
      if (userId) {
        this.categoriasDisponibles = await this.archivoService.getCategoriasUsuario(); // Método para obtener las categorías del servicio
        console.log(this.categoriasDisponibles); // Ver las categorías cargadas
      }
    } catch (error) {
      console.error('Error al cargar categorías: ', error);
    }
  }

  // Método para manejar la subida del archivo
  uploadFile(event: any) {
    const file = event.target.files[0];

    if (!this.category) {
      console.error('Debe seleccionar una categoría antes de subir el archivo.');
      return;
    }

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
    const filePath = `uploads/${userId}/${this.category}/${file.name}`;
    const storageRef = ref(this._storage, filePath);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed', (snapshot) => {
      this.uploadProgress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
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
              category: this.category,
              fileType: file.type,
              uploadedAt: new Date()
            })
          }, { merge: true }).then(() => {
            console.log('Archivo guardado en Firestore');
            setTimeout(() => {
              this.uploadProgress = 0;
              this._cdr.detectChanges();
            }, 2000);
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
