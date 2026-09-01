import { CommonModule } from '@angular/common';
import { Component, inject, ViewChild, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CardsBotonComponent } from "../../../../components/cards/cards-boton/cards-boton.component";
import { AsistenteFormularioService } from '../../../../services/shared/asistente-formulario.service';
import { PasopasoComponent } from '../../../../components/tabs/pasopaso/pasopaso.component';
import { UploadArchivosComponent } from "../../../../components/otros/upload-archivos/upload-archivos.component";
import { PdfPoliticasSeguridadVialComponent } from "../../../../components/pdfs/pdf-politicas-seguridad-vial/pdf-politicas-seguridad-vial.component";
import { Router, RouterLink } from '@angular/router';
import { LoadingComponent } from "../../../../components/loading/loading/loading.component";
import { AuthenticacionService } from '../../../../services/shared/authenticacion.service';
import { AlertaService } from '../../../../services/shared/alerta.service';
import { GestionDocumentosService } from '../../../../services/shared/gestion-documentos.service';
import { EstatusGeneralService } from '../../../../services/shared/estatus-general.service';
import { FirestoreService } from '../../../../services/shared/firestore.service';
import { ReftourlPipe } from '../../../../pipes/reftourl.pipe';
import { LimpiarnombrePipe } from '../../../../pipes/limpiarnombre.pipe';
import { FechafirestorePipe } from '../../../../pipes/fechafirestore.pipe';
import { Models } from '../../../../interfaces/models';
import { AlertaInformativoComponent } from "../../../../components/alertas/alerta-informativo/alerta-informativo.component";


@Component({
  selector: 'app-politicaseguridadvial',
  standalone: true,
  imports: [CommonModule, CardsBotonComponent, FormsModule, ReactiveFormsModule, PasopasoComponent, UploadArchivosComponent, PdfPoliticasSeguridadVialComponent, LoadingComponent, RouterLink, ReftourlPipe, LimpiarnombrePipe, FechafirestorePipe, AlertaInformativoComponent],
  templateUrl: './politicaseguridadvial.component.html',
  schemas:[CUSTOM_ELEMENTS_SCHEMA],
  styleUrl: './politicaseguridadvial.component.css'
})
export class PoliticaseguridadvialComponent {

  nombreModulo: string = '003-politicas-seguridad-vial';

  private _authcations = inject(AuthenticacionService);
  private _gestDoc = inject(GestionDocumentosService);
  private _estatus = inject(EstatusGeneralService);
  private _firestore = inject(FirestoreService);
  public _alerta = inject(AlertaService);

  nit = this._authcations.getCurrentUser().displayName;
  empresa = this._authcations.getCurrentUser().photoURL;
  uid = this._authcations.getCurrentUser().uid;

  documento1: Models.Documentos.Documento[] = [];
  historico1: Models.Documentos.Documento[] = [];
  cargando: Record<string, boolean> = {};
  eliminando: Record<string, boolean> = {};
  mostrarHistorico: Record<string, boolean> = {};

  @ViewChild(PasopasoComponent) pasoPaso!: PasopasoComponent;
  @ViewChild(PdfPoliticasSeguridadVialComponent) crearPdf!: PdfPoliticasSeguridadVialComponent;

  form!: FormGroup;
  openTab = 0;

  id_formulario: string = "0";
  dataEmpresa: string | null = sessionStorage.getItem('empresaData');
  dataEmpresa2: Models.Empresa.ConsultarEmpresa = JSON.parse(this.dataEmpresa ?? '{}');
  porcentaje = 0;

  userId: string | null = null;
  isLoading = true;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private _asistente: AsistenteFormularioService,
  ){
    this.iniciarformulariolimpio();
    this.isLoading = false;
  }

  ngOnInit(): void {
    this.id_formulario = sessionStorage.getItem('id_formulario_politica_s_vial') || "0";
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
      console.error('[PoliticaSeguridad] eliminarVigente:', error);
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
    this.documento1 = docs['Politica de Seguridad Vial'] ?? [];
    this.historico1 = hist['Politica de Seguridad Vial'] ?? [];
    await this.actualizarEstatusGeneral();
  }

  private async actualizarEstatusGeneral(): Promise<void> {
    const modulo: Models.Procesos.Modulo003PoliticaSeguridad = {
      total_progreso: this.documento1.length > 0 ? 100 : 0,
      actaPolitica: { total: this.documento1.length > 0 ? 1 : 0 },
    };
    await this._estatus.registrarProgreso('003-politicas-seguridad-vial', modulo);
  }

  iniciarformulariolimpio() {
    this.form = this.fb.group({
      fechaDocumento: ['', Validators.required]
    });
  }

  async toggleTabs(tabNumber: number, porce: string) {
    this.openTab = tabNumber;

    if(this.openTab > 1 && this.openTab < 4){

      if(this.openTab == 2){
        if (this.id_formulario !== "0") {
          const dataCruda = await this._asistente.getFormulario('003-politicas-seguridad-vial', this.id_formulario);
          this.form.patchValue(dataCruda);
        } else {
          sessionStorage.setItem('id_formulario_politica_s_vial', Date.now().toString());
          this.id_formulario = sessionStorage.getItem('id_formulario_politica_s_vial') as string;
        }
      }

      if (porce === "Avanza") {
        this.porcentaje = Math.min(this.porcentaje + 20, 100);
        this.pasoPaso.nextStep();
      } else if(porce === "Atras") {
        this.porcentaje = Math.max(this.porcentaje - 20, 0);
        this.pasoPaso.prevStep();
      }

      this._asistente.autoGuardar('003-politicas-seguridad-vial', this.id_formulario ?? "", this.form.value, { estado: this.porcentaje });
    }
  }

  async onSubmit(){
    if (this.form.valid) {
      this.crearPdf.generatePdf(true);
      this.porcentaje = 100;
      this.toggleTabs(3, "no");
      this.borroSessionIdFormulario();
    } else {
      this.form.markAllAsTouched();
    }
  }

  async vistaPrevia(){
    if (this.form.valid) {
      await this._asistente.autoGuardar('003-politicas-seguridad-vial', this.id_formulario ?? "", this.form.value, { estado: 100 });
      this.crearPdf.generatePdf(true);
    } else {
      this.form.markAllAsTouched();
    }
  }

  borroSessionIdFormulario(){
    sessionStorage.removeItem('id_formulario_politica_s_vial');
    this.id_formulario = "0";
  }

  irdashboard(){
    this.router.navigate(['admin/dashboardplanificar']);
  }
}
