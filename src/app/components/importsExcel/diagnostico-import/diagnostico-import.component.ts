import { Component, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Storage, ref, uploadBytesResumable, getDownloadURL } from '@angular/fire/storage';
import { Firestore, setDoc, doc, arrayUnion } from '@angular/fire/firestore';
import * as XLSX from 'xlsx';
import { LoginService } from '../../../services/login.service';
import { AlertaService } from '../../../services/alerta.service';
import { AlertaInformativoComponent } from "../../alertas/alerta-informativo/alerta-informativo.component";

@Component({
  selector: 'app-diagnostico-import',
  standalone: true,
  imports: [CommonModule, AlertaInformativoComponent],
  templateUrl: './diagnostico-import.component.html',
  styleUrl: './diagnostico-import.component.css'
})
export class DiagnosticoImportComponent {

  //////LOADDING////////
  cargando: boolean = false;
  ///////FIN LOADING///////

  uploadProgress: number = 0;
  downloadURL: string | null = null;

  data: any[] = [];
  header: string[] = [];;

  private _loginsercivico = inject(LoginService);
  private _storage = inject(Storage);
  private _firestore = inject(Firestore);
  public _alertaService = inject(AlertaService);


  @Input() urlFire: string = "006-diagnostico"; // True diseño transparente
  @Input() urlStore: string = "006-diagnostico"; // True diseño transparente
  

  // Método para manejar la subida del archivo
  uploadFile(event: any) {
    
    if (!event.target.files || event.target.files.length === 0) {
      //console.log('No se seleccionó ningún archivo');
      return;
    }

    const file = event.target.files[0];

    // Verificar longitud total
  if (file.name.length > 85) {
    //console.log(`El nombre del archivo es demasiado largo. Máximo permitido 80 caracteres`);
    this._alertaService.showWarning('El nombre del archivo es demasiado largo. Máximo permitido 80 caracteres');
    return;
  }

  // Verificar el tamaño del archivo (50 MB en bytes)
  const maxFileSize = 50 * 1024 * 1024; // 50 MB
  if (file.size > maxFileSize) {
    this._alertaService.showWarning('El archivo es demasiado grande. El tamaño máximo permitido es 50 MB.');
    return;
  }
    
  this.cargando = true;
  this.uploadProgress = 0; // Reiniciar el progreso cada vez que se selecciona un archivo nuevo

    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' // .xlsx
    ];

    if (!allowedTypes.includes(file.type)) {
      //console.error('Tipo de archivo no permitido');
      this._alertaService.showWarning('Tipo de archivo no permitido');
      return;
    }

  
    this.processExcelFile(file); // Llamada al método separado


    const userId = this._loginsercivico.userIdSignal();
    const cleanFileName = file.name.replace(/[/\\:\*\?"<>\|,~]/g, '_').replace(/\s+/g, '_').replace(/_+/g, '_');
    
    const filePath = `uploads/${userId}/${this.urlStore}/${cleanFileName}`;
    const storageRef = ref(this._storage, filePath);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed', 
      (snapshot) => {
        this.uploadProgress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      }, (error) => {
        console.error('Error al subir archivo:', error);
      }, 
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          this.downloadURL = downloadURL;
          event.target.value = '';
          this.uploadProgress = 0;
          this.cargando = false;
          console.log("Link del archivo",this.downloadURL);
  
            // const userDocRef = doc(this._firestore, `${this.urlFire}/${userId}`);
            // setDoc(
            //   userDocRef, 
            //   { [timestamp]: { URL: downloadURL, estado: 100, fechaCreacion: new Date(), nombrePDf: uniqueFileName, tipo: "Cargado" } },
            //   { merge: true }).then(() => {
            //   console.log('Archivo guardado en Firestore');
  
              
              
        } catch (error) {
          console.error('Error al guardar en Firestore:', error);
          this._alertaService.showError('Error conexión internet. Contacte con su proveedor');
          event.target.value = '';
          this.uploadProgress = 0;
          this.cargando = false;
        }
        
      }
    );
  }


  private processExcelFile(file: File) {

    const userId = this._loginsercivico.userIdSignal();

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

      const userDocRef = doc(this._firestore, `006-diagnostico/${userId}/contenido/${userId}`);
      
        setDoc(
          userDocRef, 
          { data: this.data }
        ).then(() => {
          this._alertaService.showSuccess('Datos cargados correctamente');

        });

      this.header = Object.keys(this.data[0]); // Asume que el primer objeto tiene todas las claves
      console.log('HEADSSS', this.header);
    };

    reader.readAsArrayBuffer(file);
  }
  
}
