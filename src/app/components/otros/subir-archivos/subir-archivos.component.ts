import { Component, inject, OnInit, Input, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { LoginService } from '../../../services/login.service';

import { AlertaService } from '../../../services/alerta.service';

import { Storage, ref, uploadBytesResumable, getDownloadURL } from '@angular/fire/storage';
import { Firestore, setDoc, doc, getDoc } from '@angular/fire/firestore';

import { AlertaInformativoComponent } from "../../alertas/alerta-informativo/alerta-informativo.component";
import { ModalsGuiaComponent } from '../../modals/modals-guia/modals-guia.component';
import { LoadingComponent } from '../../loading/loading/loading.component';
import { SharedService } from '../../../shared/cargar-documentos/shared.service';
import { EstatusGeneralService } from '../../../services/estatus-general.service';


@Component({
  selector: 'app-subir-archivos',
  standalone: true,
  imports: [CommonModule, FormsModule, AlertaInformativoComponent, ModalsGuiaComponent, LoadingComponent],
  templateUrl: './subir-archivos.component.html',
  styleUrl: './subir-archivos.component.css'
})
export class SubirArchivosComponent implements OnInit {

  @ViewChild(ModalsGuiaComponent) modal!: ModalsGuiaComponent;

  modalConfig = {
    titulo: '',
    contenido: '',
    tamano: 'regular',
    mostrar: false,
    tipo: '' // ejemplos : confirmacion, informacion,  Se Agrega esta propiedad para identificar el tipo de modal
  };

  private modalResponse!: (value: boolean) => void;

  /////////////fin modal/////////////

  //////LOADDING////////

  cargando: boolean = false;

  ///////FIN LOADING///////
  
  private _auth = inject(LoginService);
  private _storage = inject(Storage);
  private _firestore = inject(Firestore);
  private _shared = inject(SharedService);
  private _estatusGeneral = inject(EstatusGeneralService);
  public _alertaService = inject(AlertaService);


  uploadProgress: number = 0;
  downloadURL: string | null = null;
  
  @Input() urlStore: string = "001-lider-del-pesv"; // True diseño transparente
  @Input() urlFire: string = "liderDelPesv"; // True diseño transparente
  
  ngOnInit() {
        
  }

  // Método para manejar la subida del archivo
  async uploadFile(event: any) {

    if (!event.target.files || event.target.files.length === 0) {
      //console.log('No se seleccionó ningún archivo');
      return;
    }
  
    const file = event.target.files[0];
    //console.log('Archivo seleccionado:', file);
  
    // Verificar longitud total
    if (file.name.length > 85) {
      //console.log(`El nombre del archivo es demasiado largo. Máximo permitido 80 caracteres`);
      this._alertaService.showWarning('El nombre del archivo es demasiado largo. Máximo permitido 80 caracteres');
      return;
    }

    // Verificar el tamaño del archivo (25 MB en bytes)
    const maxFileSize = 25 * 1024 * 1024; // 25 MB
    if (file.size > maxFileSize) {
      this._alertaService.showWarning('El archivo es demasiado grande. El tamaño máximo permitido es 25 MB.');
      return;
    }
  
    const allowedTypes = [
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/pdf',
      'image/png',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/zip',
      'application/x-zip-compressed'
    ];
  
    if (!allowedTypes.includes(file.type)) {
      //console.error('Tipo de archivo no permitido');
      this._alertaService.showWarning('Tipo de archivo no permitido');
      return;
    }
  
    const userId = this._auth.userIdSignal();
    if (!userId) {
      //console.error('Usuario no autenticado');
      this._alertaService.showError('Reintente iniciar sesión');
      return;
    }
  
    // Verificar si el archivo ya existe
    const userDocRef = doc(this._firestore, `${this.urlFire}/${userId}`);
    const docSnap = await getDoc(userDocRef);
    
    const cleanFileName = file.name.replace(/[/\\:\*\?"<>\|,~]/g, '_').replace(/\s+/g, '_').replace(/_+/g, '_');
    let timestamp = Date.now();
  
    if (docSnap.exists()) {

      const data = docSnap.data();
      const existingFile = Object.entries(data).find(([id, doc]) =>
        doc.nombrePDf === cleanFileName
      );
      
  
      if (existingFile) {
        
        const confirma = await this.mostrarModalConfirmacion('Archivo existente', 'Este archivo ya existe. ¿Desea reemplazarlo?');
        if (!confirma) {
          event.target.value = '';
          return;
        }
        timestamp = parseInt(existingFile[0]);
      }
    }
  
    // Proceder con la subida
    this.cargando = true;
    this.uploadProgress = 0;
    const filePath = `uploads/${userId}/${this.urlStore}/${cleanFileName}`;
    const storageRef = ref(this._storage, filePath);
    const uploadTask = uploadBytesResumable(storageRef, file);
  
    uploadTask.on('state_changed', 
      (snapshot) => {
        this.uploadProgress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      }, 
      (error) => {
        this._alertaService.showError('Error conexión internet. Contacte con su proveedor');
        this.uploadProgress = 0;
      }, 
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          this.downloadURL = downloadURL;
          await setDoc(userDocRef, { 
            [timestamp]: {
              nombrePDf: cleanFileName,
              URL: downloadURL,
              estado: "100",
              tipo: "Cargado",
              type: file.type,
              fechaCreacion: new Date(),
              mostrar: true,
            }
          }, { merge: true });

          // al Cargar el un documento estoy indicando que se cumple el 100% del modulo
          this._estatusGeneral.setEstatusGeneralFirestore({[this.urlStore]:{ estado: '100' }});

          event.target.value = '';
          this._shared.notificarNuevaSubida();
          //console.log('Archivo guardado en Firestore');
          this._alertaService.showSuccess('Archivo subido correctamente');
          this.uploadProgress = 0;
          this.cargando = false;
  
        } catch (error) {
          //console.error('Error al guardar en Firestore:', error);
          this._alertaService.showError('Error conexión internet. Contacte con su proveedor');
          this.uploadProgress = 0;
          this.cargando = false;
        }
      }
    );
  }

  guardarCambios() {
    
    this.modalConfig.mostrar = false;
    this.modalResponse(true);
  }

  cancelarCambios() {
    
    this.modalConfig.mostrar = false;
    this.modalResponse(false);
  }

  // Métodos separados para cada tipo de modal
  private async mostrarModalConfirmacion(titulo: string, mensaje: string): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
        this.modalResponse = resolve;
        this.modalConfig = {
            titulo: titulo,
            contenido: mensaje,
            tamano: 'small',
            mostrar: true,
            tipo: 'confirmacion'
        };
    });
  }

}
