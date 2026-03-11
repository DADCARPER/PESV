import { CommonModule } from '@angular/common';
import { Component, inject, signal, Input } from '@angular/core';
import { AuthenticacionService } from '../../../../../services/shared/authenticacion.service';
import { FirestoreService } from '../../../../../services/shared/firestore.service';
import { AlertaService } from '../../../../../services/shared/alerta.service';
import { AlertaInformativoComponent } from "../../../../../components/alertas/alerta-informativo/alerta-informativo.component";
import * as XLSX from 'xlsx';
import { LoadingComponent } from "../../../../../components/loading/loading/loading.component";
import { StorageService } from '../../../../../services/shared/storage.service';
import { Models } from '../../../../../interfaces/models'; 

@Component({
  selector: 'app-f1-add-file',
  standalone: true,
  imports: [CommonModule, AlertaInformativoComponent, LoadingComponent],
  templateUrl: './f1-add-file.component.html',
  styleUrl: './f1-add-file.component.css'
})
export class F1AddFileComponent {

  private _authcations = inject(AuthenticacionService);
  private _firestore = inject(FirestoreService);
  private _storage = inject(StorageService)
  public _alerta = inject (AlertaService);

  @Input() nombreModulo: string = '001-lider-pesv';

  nit = this._authcations.getCurrentUser().displayName; //NIT DE LA EMPRESA ACTUAL
  empresa = this._authcations.getCurrentUser().photoURL; // NOMBRE DE LA EMREPSA
  uid = this._authcations.getCurrentUser().uid; //UID UNICO

  uploadProgress: number = 0;
  downloadURL: string | null = null;

  data: any[] = [];
  header: string[] = [];


  // Signal para controlar la visibilidad del modal
  mostrarModal = signal<boolean>(false);
  
  cargando: boolean = false;

  constructor(){
    
  }
  

  // Método para cerrar el modal
  cerrarModal() {

    this.mostrarModal.set(false);
    
  }

  // Método para abrir el modal
  abrirModal() { // crear o editar
    this.mostrarModal.set(true);
  }

  async handleSave(){

  }

  // Método para manejar el clic en "Cancelar"
  handleCancel() {
    this.cerrarModal();
  }

  // Método para manejar la subida del archivo
  async uploadFile(event: any) {
    //const target: DataTransfer = <DataTransfer>(event.target);
    const file = event.target.files[0];
    
    this.uploadProgress = 0; // Reiniciar el progreso cada vez que se selecciona un archivo nuevo

    const allowedTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    // if (!allowedTypes.includes(file.type)) {
    //   console.error('Tipo de archivo no permitido');
    //   return;
    // }

    this.cargando = true;

    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const timestamp = Date.now(); // Marca de tiempo actual
    const uniqueFileName = `${timestamp}_${cleanFileName}`;
    
    try {
      const resultadoFile = await this._storage.uploadFile(`Empresas/${this.nit}/${this.nombreModulo}`,uniqueFileName, file) 
      console.log('si cargooooooooo-->', resultadoFile.metadata)
      const archivo: Models.Documentos.Documento = {
        nombre: uniqueFileName,
        ruta: resultadoFile.ref.fullPath,
        modulo: this.nombreModulo,
        nitempresa: this.nit,
        nombreEmpresa: this.empresa,
        pesobytes: file.size,
        tipo: file.type,
        extension:file.name.split('.').pop() || '',
        uid: this.uid,
      }
      await this._firestore.createDocument(`Empresas/${this.nit}/documentos`,archivo);
      this._alerta.showSuccess('Sede creada exitosamente.');
      this.cargando = false;
      this.cerrarModal(); // Cerrar el modal después de guardar
    } catch (error) {
      this._alerta.showError('Tu Conexión Internet Fallo');
    }

    // const userId = sessionStorage.getItem('userId');
    // const cleanFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
    // const timestamp = Date.now(); // Marca de tiempo actual
    // const uniqueFileName = `${timestamp}_${cleanFileName}`;
    // const filePath = `uploads/${userId}/${this.urlStore}/${uniqueFileName}`;
    // const storageRef = ref(this._storage, filePath);
    // const uploadTask = uploadBytesResumable(storageRef, file);

    // uploadTask.on('state_changed', (snapshot) => {
    //   this.uploadProgress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
    // }, (error) => {
    //   console.error('Error al subir archivo:', error);
    // }, () => {
    //   getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
    //     this.downloadURL = downloadURL;
    //     this._cdr.detectChanges();

    //       const userDocRef = doc(this._firestore, `${this.urlFire}/${userId}`);
    //       setDoc(
    //         userDocRef, 
    //         { [timestamp]: { URL: downloadURL, estado: 100, fechaCreacion: new Date(), nombrePDf: uniqueFileName, tipo: "Cargado" } },
    //         { merge: true }).then(() => {
    //         console.log('Archivo guardado en Firestore');

    //         // Esperamos 2 segundos y luego reiniciamos el progreso a 0
    //         setTimeout(() => {
    //           this.uploadProgress = 0;
    //           this._cdr.detectChanges();
    //         }, 2000); // 2000 ms = 2 segundos
            
    //       }).catch((error) => {
    //         console.error('Error al guardar en Firestore:', error);
    //       });
        

    //   });
    // });
  }


  processExcelFile(file: File) {

    const reader: FileReader = new FileReader();
    reader.onload = async(e: any) => {
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
      const json = XLSX.utils.sheet_to_json(worksheet, { header: ['documento','nombre','cargo','genero','fechaNacimiento','jornada','horasLaborales','escolaridad','estrato','estadoCivil','telefono','email','tiempoEmpresa','tipoContrato','areaDepartamento'], range: rango, defval: "No Dato" }); // Convierte la hoja de trabajo a JSON

      // Asigna los datos y el encabezado a las propiedades del componente
      this.data = json;
      console.log('Datos del archivo:', this.data[1]['fechaNacimiento']);
      
      for (let i = 1; i < this.data.length; i++){

        // Verifica si fechaNacimiento es un número (número de serie de Excel)
        if (typeof this.data[i]['fechaNacimiento'] === 'number') {
          this.data[i]['fechaNacimiento'] = this.excelDateToJSDate(this.data[i]['fechaNacimiento']);
        }
      
        try {
          await this._firestore.createDocument(`Empresas/${this.nit}/006-diagnostico/${this.uid}/colaboradores`,this.data[i]);
          this._alerta.showSuccess('Sede creada exitosamente.');
          //this.cerrarModal(); // Cerrar el modal después de guardar
        } catch (error) {
          this._alerta.showError('Tu Conexión Internet Fallo');
        }

      }
      


      // const userDocRef = doc(this._firestore, `006-diagnostico/${userId}/contenido/contenido`);
      //     setDoc(
      //       userDocRef, 
      //       { data: this.data },
      //       { merge: true }).then(() => {
      //       console.log('Archivo guardado en Firestore');

      //     });

      this.header = Object.keys(this.data[0]); // Asume que el primer objeto tiene todas las claves
      console.log('HEADSSS', this.header);
      this.cargando = false;
    };

    reader.readAsArrayBuffer(file);
  }

  excelDateToJSDate(serial: number): string {
    const utc_days = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400; // segundos
    const date_info = new Date(utc_value * 1000);

    // Ajuste por zona horaria y formato ISO
    return date_info.toISOString().split('T')[0];
  }

}
