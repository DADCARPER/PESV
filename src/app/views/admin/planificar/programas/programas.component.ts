import { CommonModule } from '@angular/common';
import { Component, inject, signal, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FirestoreService } from '../../../../services/shared/firestore.service';
import { AaDatosDefaultService } from '../../../../services/shared/aa-datos-default.service';
import { AlertaService } from '../../../../services/shared/alerta.service';
import { AuthenticacionService } from '../../../../services/shared/authenticacion.service';
import { EmpresaService } from '../../../../services/shared/empresa.service';
import { Models } from '../../../../interfaces/models';
import { FechafirestorePipe, FechaMesAnoPipe } from '../../../../pipes/fechafirestore.pipe';
import { DetallesActividadComponent } from './detalles-actividad/detalles-actividad.component';

@Component({
  selector: 'app-programas',
  standalone: true,
  imports: [CommonModule,RouterLink,FechafirestorePipe,FechaMesAnoPipe,DetallesActividadComponent],
  templateUrl: './programas.component.html',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  styleUrl: './programas.component.css'
})
export class ProgramasComponent {

  private _authcations = inject(AuthenticacionService);
  private _empresaSrv = inject(EmpresaService);
  private _firestore = inject(FirestoreService);
  private _iniciardatos = inject(AaDatosDefaultService);
  public _alerta = inject(AlertaService);

  nit = this._authcations.getCurrentUser().displayName; //NIT DE LA EMPRESA ACTUAL
  /** Razon social, leida de Empresas/{nit} y no de photoURL de Auth. */
  get empresa(): string {
    return this._empresaSrv.nombre();
  }
  uid = this._authcations.getCurrentUser().uid; //UID UNICO

  // Documentos a mostrar
  programas: any = [];
  idprograma: string = '';
  tituloPrograma: string = '';
  objetivoPrograma: string = '';

  openTab = signal(0);
  /** Distingue "consultando" de "no hay nada": antes ambos se veían igual. */
  cargando = signal(true);
  sembrando = signal(false);

  constructor(){
    this.consultarProgramas();
  }

  async consultarProgramas() {
    this.cargando.set(true);
    this.programas = [];

    const periodo = this._authcations.periodo();
    const path = `Empresas/${this.nit}/periodos/${periodo}/008-programas-gestion-riesgos`;
    const q: Models.Firebases.whereQuery[] = [['estado', '==', 'Activo']];

    try {
      const snapshot = await this._firestore.getDocumentsQuery<Models.Programas.ConsultarPrograma>(path, q);
      this.programas = snapshot.docs.map((doc: any) => doc.data());
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error al consultar los programas';
      console.error('[Programas] consultarProgramas:', error);
      this._alerta.showError(msg);
    } finally {
      this.cargando.set(false);
    }
  }

  /**
   * Siembra los programas base en el periodo activo.
   * Cada periodo arranca con su propia colección, así que esto resuelve tanto
   * un módulo recién estrenado como el primer día de un año nuevo.
   */
  async cargarProgramasBase() {
    this.sembrando.set(true);
    try {
      await this._iniciardatos.inicializarDatos008Programas(this.nit, this._authcations.periodo());
      this._alerta.showSuccess('Programas base cargados exitosamente.');
      await this.consultarProgramas();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error al cargar los programas base';
      console.error('[Programas] cargarProgramasBase:', error);
      this._alerta.showError(msg);
    } finally {
      this.sembrando.set(false);
    }
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
