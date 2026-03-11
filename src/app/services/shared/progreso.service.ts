import { inject, Injectable } from '@angular/core';
import { AlertaService } from './alerta.service';
import { FirestoreService } from './firestore.service';

interface ModuloProgreso {
  total: number;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class ProgresoService {

  private _firestore = inject(FirestoreService);
  public _alerta = inject (AlertaService);

  constructor() { }

  async inicializarProgreso(nitEmpresa:string){

    const datos = {
      '001-lider-pesv-documentos':{
        total_progreso : 0,
        docIdentidad:{
          total:0
        },
        actaLiderpesv:{
          total:0
        },
        certificadoCompetencia:{
          total:0
        },
        docExperienciaProfesional:{
          total:0
        },
      },
      '002-comite-seguridad-vial-documentos':{
        total_progreso : 0,
        actacomite:{
          total:0
        }
      },
      '003-politicas-seguridad-vial-documentos':{
        total_progreso : 0,
        actaPolitica:{
          total:0
        }
      },
      '004-liderazgo-compromiso-documentos':{
        total_progreso : 0,
        actaLiderazgo:{
          total:0
        }
      },
      '006-diagnostico':{
        total_progreso : 0,
        InfoOrganizacional:{
          total:0
        },
        colaboradores:{
          total:0
        },
        flota:{
          total:0
        },
        contratistas:{
          total:0
        },
        rutas:{
          total:0
        },
        emergencias:{
          total:0
        }
      },
      Total_General:0
    }
    try {
      await this._firestore.createDocument(`EstatusGeneral`,datos,nitEmpresa);
      this._alerta.showSuccess('Sede creada exitosamente.');
    } catch (error) {
      this._alerta.showError('Tu Conexión Internet Fallo');
    }

  }

  async actualizarProfresoModulo(nitEmpresa:string,modulo: string,seccion: string, valor:number){
    let datoActualizar: any = {};
    datoActualizar[`${modulo}.${seccion}.total`] = valor;
    // console.log('ServicionActualizar--------->',datoActualizar)
    try {
      await this._firestore.updateDocument(`EstatusGeneral/${nitEmpresa}`,datoActualizar);
      this.recalcularProgreso(nitEmpresa,modulo);
      //this._alerta.showSuccess('Sede actualizada exitosamente.');
    } catch (error) {
      this._alerta.showError('Tu Conexión Internet Fallo');
    }

  }

  async recalcularProgreso(nitEmpresa: string, modulo: string){
    // Obtener documento actual
    const path = `EstatusGeneral/${nitEmpresa}`;
    const doc: any = await this._firestore.getDocument(path);
    const moduloData = doc.data()[modulo];
    // console.log('ServicionActualizar--------->',moduloData);
    // Calcular nuevo total (suma de todos los modulo excepto 'total')

    let nuevoTotal = 0;
    Object.keys(moduloData).forEach(key => {
      
      const modulo = moduloData[key] as ModuloProgreso;
      // console.log('ServicionActualizar--------->',modulo.total  );
    
      if (modulo && modulo.total !== undefined) {
        nuevoTotal += modulo.total;
      }

    });
    console.log('ServicionActualizar--------->',nuevoTotal  );

    const totalActualizar: any = {};
    totalActualizar[`${modulo}.Total_General`] = nuevoTotal;

    try {
      this._firestore.updateDocument(path,totalActualizar);
      //this._alerta.showSuccess('Sede actualizada exitosamente.');
    } catch (error) {
      this._alerta.showError('Tu Conexión Internet Fallo');
    }

  }


  
}
