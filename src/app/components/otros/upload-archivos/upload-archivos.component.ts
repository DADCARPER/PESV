import { CommonModule } from '@angular/common';
import { Component, inject, ChangeDetectorRef, Input } from '@angular/core';
import { Storage, ref, uploadBytesResumable, getDownloadURL } from '@angular/fire/storage';
import { Firestore, setDoc, doc, arrayUnion } from '@angular/fire/firestore';
import * as XLSX from 'xlsx';

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

  data: any[] = [];
  header: string[] = [];;

  private _storage = inject(Storage);
  private _firestore = inject(Firestore);
  private _cdr = inject(ChangeDetectorRef);

  @Input() urlStore: string = "001-lider-del-pesv"; // True diseño transparente
  @Input() urlFire: string = "liderDelPesv"; // True diseño transparente

  // Método para manejar la subida del archivo
  uploadFile(event: any) {
    //const target: DataTransfer = <DataTransfer>(event.target);
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

    if (
      file.type === 'application/vnd.ms-excel' || // .xls
      file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' // .xlsx
    ) {
      this.processExcelFile(file); // Llamada al método separado
    }

    const userId = sessionStorage.getItem('userId');
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const timestamp = Date.now(); // Marca de tiempo actual
    const uniqueFileName = `${timestamp}_${cleanFileName}`;
    const filePath = `uploads/${userId}/${this.urlStore}/${uniqueFileName}`;
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

          const userDocRef = doc(this._firestore, `${this.urlFire}/${userId}`);
          setDoc(
            userDocRef, 
            { [timestamp]: { URL: downloadURL, estado: 100, fechaCreacion: new Date(), nombrePDf: uniqueFileName, tipo: "Cargado" } },
            { merge: true }).then(() => {
            console.log('Archivo guardado en Firestore');

            // Esperamos 2 segundos y luego reiniciamos el progreso a 0
            setTimeout(() => {
              this.uploadProgress = 0;
              this._cdr.detectChanges();
            }, 2000); // 2000 ms = 2 segundos
            
          }).catch((error) => {
            console.error('Error al guardar en Firestore:', error);
          });
        

      });
    });
  }


  private processExcelFile(file: File) {

    const userId = sessionStorage.getItem('userId');

    const reader: FileReader = new FileReader();
    reader.onload = (e: any) => {
      const arrayBuffer = e.target.result; // Obtiene el ArrayBuffer del archivo
      const data = new Uint8Array(arrayBuffer); // Convierte el ArrayBuffer a Uint8Array
      const workbook = XLSX.read(data, { type: 'array' }); // Lee todo el documento

      // Suponiendo que solo hay una hoja y que la primera fila contiene los encabezados
      const sheetName = workbook.SheetNames[0]; // Nombre de la hoja
      const worksheet = workbook.Sheets[sheetName]; // Accedo al contenido de la Hoja de trabajo

      // Obtener el rango completo de la hoja
      const fullRange = XLSX.utils.decode_range(worksheet['!ref']!);
      // Calcular el número total de filas
      const totalRows = fullRange.e.r - fullRange.s.r + 1;
      const rango = `A1:AC${totalRows}`;
      const json = XLSX.utils.sheet_to_json(worksheet, { header: ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z','aa','ab'], range: rango, defval: "N/A" }); // Convierte la hoja de trabajo a JSON

      // Asigna los datos y el encabezado a las propiedades del componente
      this.data = json;
      console.log('Datos del archivo:', this.data[0]);
      const timestamp = Date.now(); // Marca de tiempo actual

      const userDocRef = doc(this._firestore, `006-diagnostico/${userId}/contenido/contenido`);
          setDoc(
            userDocRef, 
            { data: this.data },
            { merge: true }).then(() => {
            console.log('Archivo guardado en Firestore');

          });

      this.header = Object.keys(this.data[0]); // Asume que el primer objeto tiene todas las claves
      console.log('HEADSSS', this.header);
    };

    reader.readAsArrayBuffer(file);
  }

}
