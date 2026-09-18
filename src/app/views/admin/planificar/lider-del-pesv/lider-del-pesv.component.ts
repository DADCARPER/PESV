import { Component, inject, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthenticacionService } from '../../../../services/shared/authenticacion.service';
import { EmpresaService } from '../../../../services/shared/empresa.service';
import { AlertaService } from '../../../../services/shared/alerta.service';
import { GestionDocumentosService } from '../../../../services/shared/gestion-documentos.service';
import { EstatusGeneralService } from '../../../../services/shared/estatus-general.service';
import { RolUsuarioService } from '../../../../services/shared/rol-usuario.service';
import { FirestoreService } from '../../../../services/shared/firestore.service';
import { AlertaInformativoComponent } from "../../../../components/alertas/alerta-informativo/alerta-informativo.component";
import { LoadingComponent } from "../../../../components/loading/loading/loading.component";
import { ReftourlPipe } from '../../../../pipes/reftourl.pipe';
import { LimpiarnombrePipe } from '../../../../pipes/limpiarnombre.pipe';
import { FechafirestorePipe } from '../../../../pipes/fechafirestore.pipe';
import { Models } from '../../../../interfaces/models';

/** Cada uno de los 4 soportes que exige el paso 1 de la Resolución 40595. */
interface PuntoDocumental {
  numero: number;
  /** Clave con la que se guarda en Firestore. No cambiar: rompería los documentos ya subidos. */
  seccion: string;
  descripcion: string;
  /** Qué sirve como soporte, en concreto. */
  ayuda: string;
  /** El asistente de plantillas solo aplica al acta. */
  conAsistente?: boolean;
}

@Component({
  selector: 'app-lider-del-pesv',
  standalone: true,
  imports: [CommonModule, RouterLink, AlertaInformativoComponent, LoadingComponent, ReftourlPipe, LimpiarnombrePipe, FechafirestorePipe],
  templateUrl: './lider-del-pesv.component.html',
  schemas:[CUSTOM_ELEMENTS_SCHEMA],
  styleUrls: ['./lider-del-pesv.component.css']
})
export class LiderDelPesvComponent implements OnInit {

  nombreModulo: string = '001-lider-pesv';

  private _authcations = inject(AuthenticacionService);
  private _empresaSrv = inject(EmpresaService);
  private _gestDoc = inject(GestionDocumentosService);
  private _estatus = inject(EstatusGeneralService);
  private _firestore = inject(FirestoreService);
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

  /** Los textos de los 4 puntos. El orden define la numeración en pantalla. */
  readonly definicionPuntos: PuntoDocumental[] = [
    {
      numero: 1,
      seccion: 'Documento de Identificación',
      descripcion: 'Identificación oficial del líder designado.',
      ayuda: 'Cédula de ciudadanía por ambas caras, cédula de extranjería o PPT, en un solo PDF legible.',
    },
    {
      numero: 2,
      seccion: 'Acta de Designación del Líder del PESV',
      descripcion: 'Documento firmado por la alta dirección que nombra al líder y fija sus responsabilidades.',
      ayuda: 'Debe indicar nombre, cargo y funciones del líder, e ir firmada por el representante legal.',
      conAsistente: true,
    },
    {
      numero: 3,
      seccion: 'Certificados de Competencia',
      descripcion: 'Formación del líder en seguridad vial y en SG-SST.',
      ayuda: 'Certificado del curso de seguridad vial (20 o 50 horas) y del curso de SG-SST. Puedes unirlos en un solo PDF.',
    },
    {
      numero: 4,
      seccion: 'Documentación de Experiencia Profesional',
      descripcion: 'Soporte de al menos 2 años de experiencia en SG-SST o seguridad vial.',
      ayuda: 'Certificados laborales, contratos o constancias que sumen el tiempo exigido.',
    },
  ];

  /** Une cada punto con sus documentos para recorrerlos en la plantilla. */
  get puntos() {
    const docs = [this.documento1, this.documento2, this.documento3, this.documento4];
    const hist = [this.historico1, this.historico2, this.historico3, this.historico4];
    return this.definicionPuntos.map((p, i) => ({
      ...p,
      docs: docs[i] ?? [],
      historico: hist[i] ?? [],
    }));
  }

  get completados(): number {
    return [this.documento1, this.documento2, this.documento3, this.documento4]
      .filter(d => d.length > 0).length;
  }

  get progreso(): number {
    return this.completados * 25;
  }

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
    const modulo: Models.Procesos.Modulo001LiderPesv = {
      total_progreso: this.progreso,
      docIdentidad:              { total: this.documento1.length > 0 ? 1 : 0 },
      actaLiderpesv:             { total: this.documento2.length > 0 ? 1 : 0 },
      certificadoCompetencia:    { total: this.documento3.length > 0 ? 1 : 0 },
      docExperienciaProfesional: { total: this.documento4.length > 0 ? 1 : 0 },
    };
    await this._estatus.registrarProgreso('001-lider-pesv', modulo);
  }
}
