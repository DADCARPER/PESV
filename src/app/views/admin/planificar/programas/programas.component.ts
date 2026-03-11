import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FirestoreService } from '../../../../services/shared/firestore.service';
import { AaDatosDefaultService } from '../../../../services/shared/aa-datos-default.service';
import { AlertaService } from '../../../../services/shared/alerta.service';
import { AuthenticacionService } from '../../../../services/shared/authenticacion.service';
import { Models } from '../../../../interfaces/models';
import { FechafirestorePipe, FechaMesAnoPipe } from '../../../../pipes/fechafirestore.pipe';
import { DetallesActividadComponent } from './detalles-actividad/detalles-actividad.component';

@Component({
  selector: 'app-programas',
  standalone: true,
  imports: [CommonModule,RouterLink,FechafirestorePipe,FechaMesAnoPipe,DetallesActividadComponent],
  templateUrl: './programas.component.html',
  styleUrl: './programas.component.css'
})
export class ProgramasComponent {

  private _authcations = inject(AuthenticacionService);
  private _firestore = inject(FirestoreService);
  private _iniciardatos = inject(AaDatosDefaultService);
  public _alerta = inject(AlertaService);

  nit = this._authcations.getCurrentUser().displayName; //NIT DE LA EMPRESA ACTUAL
  empresa = this._authcations.getCurrentUser().photoURL; // NOMBRE DE LA EMREPSA
  uid = this._authcations.getCurrentUser().uid; //UID UNICO

  // Documentos a mostrar
  programas: any = [];
  idprograma: string = '';
  tituloPrograma: string = '';
  objetivoPrograma: string = '';

  openTab = signal(0);

  constructor(){
    //this._iniciardatos.inicializarDatos008Programas('900089997');
    this.consultarProgramas();
  }

  async consultarProgramas() {
    this.programas = [];

    //console.log('Entro a consultarDocumentos');
    const path = `Empresas/${this.nit}/008-programas-gestion-riesgos`;
    let q: Models.Firebases.whereQuery[];

    q = [['estado', '==', 'Activo']];
  
    const snapshot = await this._firestore.getDocumentsQuery<Models.Programas.ConsultarPrograma>(path, q);

    snapshot.docs.forEach((doc: any) => {
    const data = doc.data();
    this.programas.push(data);
    });

    console.log('variable1', this.programas);
    

  }

  async toggleTabs(tabNumber: number, idPrograma?: string, tituloPrograma?: string, objetivoPrograma?: string ) {
    this.openTab.set(tabNumber);
    if(idPrograma){
      this.idprograma = idPrograma;
    }
    if(tituloPrograma){
      this.tituloPrograma = tituloPrograma;
    }
    if(objetivoPrograma){
      this.objetivoPrograma = objetivoPrograma;
    }
    
  }
}
