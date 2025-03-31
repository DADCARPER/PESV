import { inject, Injectable } from '@angular/core';


import { FirestoreService } from './firestore.service';
import { LoginService } from './login.service';

import { catchError, map } from 'rxjs/operators';
import { Observable, of , from } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LiderazgoCompromisoService {

  private _firestore = inject(FirestoreService);
  private _login = inject(LoginService);

  //Autoguarda y crear Documento 
  async autoGuardar(data: any, tipo: string, estado: number, id_formulario: string): Promise<void> {

    const ruta = `liderazgoCompromiso/${this._login.userIdSignal()}`; //---OJO TOMA UN TIEMPO EN TOMAR EL VALOR UID 
    const formulariosIndex = await this._firestore.getDocument(ruta);
    //console.log(formulariosIndex)

    //Verifico si entre todos los formularios que tome existe uno especifico = id_formulario
    if (formulariosIndex[id_formulario]) {

      console.log('ppppp',formulariosIndex);
        // Si el formulario ya existe, solo actualiza el campo 'estado'
        this._firestore.setDocument(ruta, { [id_formulario]: { estado: estado } } ); 
        console.log('Estado actualizado en el formulario existente');
    } else {

      console.log('xxxxxx',formulariosIndex);
      // Si el formulario no existe, crea uno nuevo con todos los datos
      const nuevoFormulario = {
          [id_formulario]:{ /// var_dinamica
            estado: estado,
            fechaCreacion: new Date(),
            tipo: tipo
          }
      };

      this._firestore.setDocument(ruta, nuevoFormulario ); 
      console.log('Nuevo formulario creado en Firestore');

    }
      const ruta2 = ruta +`/formularios/${id_formulario}`;
      
      console.log(ruta2);
      this._firestore.setDocument(ruta2,data);

      console.log('Datos del formulario guardados en Firestore en la subcolección');

  }

  async getfomularioEdit(idformulario: string){
    
    const ruta = `liderazgoCompromiso/${this._login.userIdSignal()}/formularios/${idformulario}`; //---OJO TOMA UN TIEMPO EN TOMAR EL VALOR UID 
    const formularioDocEdit = await this._firestore.getDocument(ruta);
    return formularioDocEdit;
    
  }

  //Método para SUBIR documento Blob
  async uploadPdfToFirebase(blob: Blob, formularioID: string) {

    
    //subo archivo Blob y retorno URL
    const filePath = `uploads/${this._login.userIdSignal()}/004-liderazgo-y-compromiso/${formularioID}`;
    const url = await this._firestore.uploadFileProgreso(filePath,blob);
   
    //ACTUALIZO documento INDEX CON EL NOMBRE URL Y ESTADO 100%

    const ruta = `liderazgoCompromiso/${this._login.userIdSignal()}`;
    const nuevoFormulario = {
      [formularioID]:{ /// var_dinamica
        URL: url,
        nombrePDf: `${formularioID}.pdf`,
        estado: 100
      }
    };

    this._firestore.setDocument(ruta, nuevoFormulario ); 

  }

  // Método para leer el documento desde Firestore
  leerDocumentoIndex(): Observable<any[]> {
    const filePath = `liderazgoCompromiso/${this._login.userIdSignal()}`;
    
    // Llamamos al método getDocument que devuelve un Promise
    const documentPromise = this._firestore.getDocument(filePath);

    // Convertimos el Promise en un Observable
    return from(documentPromise).pipe(
      // Transformamos el resultado si es necesario
      map((documentData: any) => {
        // Asumiendo que documentData es un objeto que contiene el contenido que quieres mostrar
        // Aquí puedes hacer cualquier transformación que necesites para los datos
        if (documentData && documentData.data) {
          return documentData.data;  // Suponiendo que `data` es un array o colección de elementos
        }
  
        // Si no tienes una estructura específica, puedes devolverlo tal cual
        return [];
      }),
      // Manejo de errores
      catchError((error) => {
        console.error("Error al leer el documento:", error);
        return of([]);  // Devuelve un array vacío en caso de error
      })
    );
  }

}
