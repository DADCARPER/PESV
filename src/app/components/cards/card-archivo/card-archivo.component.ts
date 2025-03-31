import { Component, Input, inject, ViewChild } from '@angular/core';
import { IconoSvgComponent } from "../../iconos/icono-svg/icono-svg.component";
import { LoginService } from '../../../services/login.service';
import { Firestore, doc, getDoc, updateDoc } from '@angular/fire/firestore';

import { DatePipe } from '@angular/common';
import { Storage, getStorage, ref, getDownloadURL, uploadBytes, deleteObject } from '@angular/fire/storage';
import { ModalsGuiaComponent } from '../../modals/modals-guia/modals-guia.component';
import { SharedService } from '../../../shared/cargar-documentos/shared.service';

interface ArchivoData {
  nombre: string;
  tipo: string;
  fecha: string;
  tipoIcono: 'pdf' | 'word' | 'excel' | 'photo'; // los tipos de iconos que tienes
  tipoMime?: string;
  colorIcono?: string;
  uRL: string;
}

@Component({
  selector: 'app-card-archivo',
  standalone: true,
  imports: [IconoSvgComponent, ModalsGuiaComponent],
  templateUrl: './card-archivo.component.html',
  styleUrl: './card-archivo.component.css'
})
export class CardArchivoComponent {

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

  @Input() archivo!: ArchivoData;
  @Input() urlFire: string = ""; 
  @Input() urlStore: string = ""; 

  private _auth = inject(LoginService);
  private _firestore = inject(Firestore);
  private _shared = inject(SharedService);
  private _datePipe = inject(DatePipe);

  fechaHoraActual = this._datePipe.transform(new Date(), 'yyyy-MM-dd_HH-mm-ss');

  descargarArchivo() {
    // Aquí va la lógica de descarga usando el nombre del archivo
    console.log('Descargando:', this.archivo.uRL);
  }

  async eliminarArchivo() {
    // Aquí va la lógica de eliminación
    console.log('Eliminando:', this.archivo.nombre);
    const confirma = await this.mostrarModalConfirmacion('Eliminar archivo', '¿Está seguro de eliminar este archivo?');
    
    if (!confirma) {
      console.log('Operación cancelada');
      return;
    }

    const userId = this._auth.userIdSignal();
    if (!userId) {
      console.error('Usuario no autenticado');
      return;
    }
      
    // Verificar si el archivo ya existe
    const userDocRef = doc(this._firestore, `${this.urlFire}/${userId}`);
    const docSnap = await getDoc(userDocRef);
    // Aquí va la lógica de eliminación

    if (docSnap.exists()) {
      
      const data = docSnap.data();
      const existingFile = Object.entries(data).find(([id, doc]) =>{
        console.log('Revisando archivo:', doc.nombrePDf); // Para ver cada archivo que revisa
        return doc.nombrePDf === this.archivo.nombre; 
      });
      
  
      if (existingFile) {
        
        
        const [fileId, fileData] = existingFile;
        console.log("Todo lo encontrado",fileId);
        try {
          // Actualizar solo el campo 'mostrar' a false
          await updateDoc(userDocRef, {
            [`${fileId}.mostrar`]: false,
            [`${fileId}.nombrePDf`]: this.fechaHoraActual+' - '+this.archivo.nombre, //IMPORTANTE SE DEBE PONER LA FECHA Y HORA PARA QUE NO SE REPITA EL NOMBRE
            [`${fileId}.URL`]: 'eliminado',
            [`${fileId}.estado`]: '0',
            [`${fileId}.fechaEliminado`]: this.fechaHoraActual,
          });

          const rutaDir = 'uploads/'+userId+'/'+this.urlStore+'/'+this.archivo.nombre;
          console.log('Ruta del archivo:', this.fechaHoraActual);
          this.renameFile(rutaDir, 'uploads/'+userId+'/'+this.urlStore+'/papelera/'+this.fechaHoraActual+'-'+this.archivo.nombre);

          this._shared.notificarNuevaSubida();
          console.log('Archivo marcado como oculto');
          //this._shared.notificarNuevaSubida(); // Notificar cambio
          
        } catch (error) {
          console.error('Error al actualizar el archivo:', error);
        }

      }
    }
  

  }

  async renameFile(oldFileName: string, newFileName: string) {
    const storage = getStorage();
    const oldFileRef = ref(storage, `${oldFileName}`);
    const newFileRef = ref(storage, `${newFileName}`);

    try {
      // Obtener la URL de descarga del archivo original
      const downloadURL = await getDownloadURL(oldFileRef);

      // Descargar el archivo original
      const response = await fetch(downloadURL);
      const blob = await response.blob();

      // Subir el archivo con el nuevo nombre
      await uploadBytes(newFileRef, blob);

      // Eliminar el archivo original
      await deleteObject(oldFileRef);

      console.log('Archivo renombrado exitosamente');
    } catch (error) {
      console.error('Error al renombrar el archivo:', error);
    }
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
