import { Component, inject, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthenticacionService } from '../../../../services/shared/authenticacion.service';
import { EmpresaService } from '../../../../services/shared/empresa.service';
import { AlertaService } from '../../../../services/shared/alerta.service';
import { GestionDocumentosService } from '../../../../services/shared/gestion-documentos.service';
import { EstatusGeneralService } from '../../../../services/shared/estatus-general.service';
import { RolUsuarioService } from '../../../../services/shared/rol-usuario.service';
import { AlertaInformativoComponent } from "../../../../components/alertas/alerta-informativo/alerta-informativo.component";
import { LoadingComponent } from "../../../../components/loading/loading/loading.component";
import { ReftourlPipe } from '../../../../pipes/reftourl.pipe';
import { LimpiarnombrePipe } from '../../../../pipes/limpiarnombre.pipe';
import { FechafirestorePipe } from '../../../../pipes/fechafirestore.pipe';
import { Models } from '../../../../interfaces/models';

/** Clave con la que se guarda en Firestore. No cambiar: rompería lo ya subido. */
const SECCION = 'Comité de Seguridad Vial';

@Component({
  selector: 'app-comiteseguridadvial',
  standalone: true,
  imports: [CommonModule, RouterLink, AlertaInformativoComponent, LoadingComponent, ReftourlPipe, LimpiarnombrePipe, FechafirestorePipe],
  templateUrl: './comiteseguridadvial.component.html',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  styleUrl: './comiteseguridadvial.component.css'
})
export class ComiteseguridadvialComponent implements OnInit {

  nombreModulo: string = '002-comite-seguridad-vial';
  readonly seccion = SECCION;

  private _authcations = inject(AuthenticacionService);
  private _empresaSrv = inject(EmpresaService);
  private _gestDoc = inject(GestionDocumentosService);
  private _estatus = inject(EstatusGeneralService);
  public _alerta = inject(AlertaService);
  private _rol = inject(RolUsuarioService);

  /**
   * El supervisor revisa, no carga. Ocultar las acciones es cosmetico: quien
   * manda son las reglas de Storage, que rechazan su escritura.
   */
  get editable(): boolean {
    return this._rol.editable();
  }

  nit = this._authcations.getCurrentUser().displayName;
  /** Razon social, leida de Empresas/{nit} y no de photoURL de Auth. */
  get empresa(): string {
    return this._empresaSrv.nombre();
  }
  uid = this._authcations.getCurrentUser().uid;

  documento1: Models.Documentos.Documento[] = [];
  historico1: Models.Documentos.Documento[] = [];

  cargando: Record<string, boolean> = {};
  eliminando: Record<string, boolean> = {};
  mostrarHistorico: Record<string, boolean> = {};

  get completado(): boolean {
    return this.documento1.length > 0;
  }

  get progreso(): number {
    return this.completado ? 100 : 0;
  }

  ngOnInit(): void {
    this.consultarDocumentos();
  }

  async uploadFile(event: any, seccion: string) {
    this.cargando[seccion] = true;
    try {
      await this._gestDoc.uploadFile({
        nit: this.nit,
        empresa: this.empresa,
        uid: this.uid,
        nombreModulo: this.nombreModulo,
        event,
        seccion,
        currentDocs: this.documento1,
        periodo: this._authcations.periodo(),
      });
      await this.consultarDocumentos();
    } finally {
      this.cargando[seccion] = false;
    }
  }

  async eliminarVigente(doc: Models.Documentos.Documento, seccion: string) {
    if (!doc.id) return;
    this.eliminando[seccion] = true;
    try {
      await this._gestDoc.marcarHistorico(this.nit, this.nombreModulo, doc.periodo ?? this._authcations.periodo(), doc.id!);
      await this.consultarDocumentos();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error al eliminar el documento';
      console.error('[ComiteSeguridad] eliminarVigente:', error);
      this._alerta.showError(msg);
    } finally {
      this.eliminando[seccion] = false;
    }
  }

  toggleHistorico(seccion: string) {
    this.mostrarHistorico[seccion] = !this.mostrarHistorico[seccion];
  }

  async consultarDocumentos() {
    const periodo = this._authcations.periodo();
    const [docs, hist] = await Promise.all([
      this._gestDoc.consultarDocumentos(this.nit, this.nombreModulo, periodo),
      this._gestDoc.consultarHistorico(this.nit, this.nombreModulo, periodo),
    ]);
    this.documento1 = docs[SECCION] ?? [];
    this.historico1 = hist[SECCION] ?? [];
    await this.actualizarEstatusGeneral();
  }

  private async actualizarEstatusGeneral(): Promise<void> {
    const modulo: Models.Procesos.Modulo002ComiteSeguridad = {
      total_progreso: this.progreso,
      actacomite: { total: this.completado ? 1 : 0 },
    };
    await this._estatus.registrarProgreso('002-comite-seguridad-vial', modulo);
  }
}
