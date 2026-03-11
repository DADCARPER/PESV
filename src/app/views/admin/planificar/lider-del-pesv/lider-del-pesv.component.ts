import { Component, inject, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CardsBotonComponent } from "../../../../components/cards/cards-boton/cards-boton.component";
import { PasopasoComponent } from "../../../../components/tabs/pasopaso/pasopaso.component";
import { AuthenticacionService } from '../../../../services/shared/authenticacion.service';
import { AlertaService } from '../../../../services/shared/alerta.service';
import { GestionDocumentosService } from '../../../../services/shared/gestion-documentos.service';
import { FirestoreService } from '../../../../services/shared/firestore.service';
import { AlertaInformativoComponent } from "../../../../components/alertas/alerta-informativo/alerta-informativo.component";
import { LoadingComponent } from "../../../../components/loading/loading/loading.component";
import { ReftourlPipe } from '../../../../pipes/reftourl.pipe';
import { LimpiarnombrePipe } from '../../../../pipes/limpiarnombre.pipe';
import { FechafirestorePipe } from '../../../../pipes/fechafirestore.pipe';
import { EditorComponent } from "../../../../components/editor/editor.component";
import { Models } from '../../../../interfaces/models';

@Component({
  selector: 'app-lider-del-pesv',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, CardsBotonComponent, PasopasoComponent, RouterLink, AlertaInformativoComponent, LoadingComponent, ReftourlPipe, LimpiarnombrePipe, FechafirestorePipe, EditorComponent],
  templateUrl: './lider-del-pesv.component.html',
  schemas:[CUSTOM_ELEMENTS_SCHEMA],
  styleUrls: ['./lider-del-pesv.component.css']
})
export class LiderDelPesvComponent implements OnInit {

  nombreModulo: string = '001-lider-pesv';

  private _authcations = inject(AuthenticacionService);
  private _gestDoc = inject(GestionDocumentosService);
  private _firestore = inject(FirestoreService);
  public _alerta = inject(AlertaService);

  nit = this._authcations.getCurrentUser().displayName;
  empresa = this._authcations.getCurrentUser().photoURL;
  uid = this._authcations.getCurrentUser().uid;

  documento1: Models.Documentos.Documento[] = [];
  documento2: Models.Documentos.Documento[] = [];
  documento3: Models.Documentos.Documento[] = [];
  documento4: Models.Documentos.Documento[] = [];

  historico1: Models.Documentos.Documento[] = [];
  historico2: Models.Documentos.Documento[] = [];
  historico3: Models.Documentos.Documento[] = [];
  historico4: Models.Documentos.Documento[] = [];

  openTab = 0;
  cargando: Record<string, boolean> = {};
  eliminando: Record<string, boolean> = {};
  mostrarHistorico: Record<string, boolean> = {};

  constructor() {}

  ngOnInit(): void {
    this.consultarDocumentos();
  }

  async uploadFile(event: any, seccion: string) {
    this.cargando[seccion] = true;
    const docsMap: Record<string, Models.Documentos.Documento[]> = {
      'Documento de Identificación': this.documento1,
      'Acta de Designación del Líder del PESV': this.documento2,
      'Certificados de Competencia': this.documento3,
      'Documentación de Experiencia Profesional': this.documento4,
    };
    try {
      await this._gestDoc.uploadFile({
        nit: this.nit,
        empresa: this.empresa,
        uid: this.uid,
        nombreModulo: this.nombreModulo,
        event,
        seccion,
        currentDocs: docsMap[seccion] ?? [],
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
      console.error('[LiderPesv] eliminarVigente:', error);
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
    this.documento1 = docs['Documento de Identificación'] ?? [];
    this.documento2 = docs['Acta de Designación del Líder del PESV'] ?? [];
    this.documento3 = docs['Certificados de Competencia'] ?? [];
    this.documento4 = docs['Documentación de Experiencia Profesional'] ?? [];
    this.historico1 = hist['Documento de Identificación'] ?? [];
    this.historico2 = hist['Acta de Designación del Líder del PESV'] ?? [];
    this.historico3 = hist['Certificados de Competencia'] ?? [];
    this.historico4 = hist['Documentación de Experiencia Profesional'] ?? [];
    await this.actualizarEstatusGeneral();
  }

  private async actualizarEstatusGeneral(): Promise<void> {
    const periodo = this._authcations.periodo();
    const modulo: Models.Procesos.Modulo001LiderPesv = {
      total_progreso: [this.documento1, this.documento2, this.documento3, this.documento4]
        .filter(d => d.length > 0).length * 25,
      docIdentidad:              { total: this.documento1.length > 0 ? 1 : 0 },
      actaLiderpesv:             { total: this.documento2.length > 0 ? 1 : 0 },
      certificadoCompetencia:    { total: this.documento3.length > 0 ? 1 : 0 },
      docExperienciaProfesional: { total: this.documento4.length > 0 ? 1 : 0 },
    };
    try {
      await this._firestore.upsertDocument(`EstatusGeneral/${this.nit}`, {
        periodo,
        '001-lider-pesv-documentos': modulo,
      });
    } catch (error: unknown) {
      console.error('[LiderPesv] actualizarEstatusGeneral:', error);
    }
  }
}
