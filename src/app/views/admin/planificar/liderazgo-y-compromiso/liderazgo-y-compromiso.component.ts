import { Component, inject, ViewChild, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { LoadingComponent } from "../../../../components/loading/loading/loading.component";
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CardsBotonComponent } from "../../../../components/cards/cards-boton/cards-boton.component";
import { AsistenteFormularioService } from '../../../../services/shared/asistente-formulario.service';
import { PasopasoComponent } from '../../../../components/tabs/pasopaso/pasopaso.component';
import { PdfLiderazgoCompromisoComponent } from '../../../../components/pdfs/pdf-liderazgo-compromiso/pdf-liderazgo-compromiso.component';
import { UploadArchivosComponent } from "../../../../components/otros/upload-archivos/upload-archivos.component";
import { AuthenticacionService } from '../../../../services/shared/authenticacion.service';
import { AlertaService } from '../../../../services/shared/alerta.service';
import { GestionDocumentosService } from '../../../../services/shared/gestion-documentos.service';
import { EstatusGeneralService } from '../../../../services/shared/estatus-general.service';
import { FirestoreService } from '../../../../services/shared/firestore.service';
import { AlertaInformativoComponent } from "../../../../components/alertas/alerta-informativo/alerta-informativo.component";
import { ReftourlPipe } from '../../../../pipes/reftourl.pipe';
import { LimpiarnombrePipe } from '../../../../pipes/limpiarnombre.pipe';
import { FechafirestorePipe } from '../../../../pipes/fechafirestore.pipe';
import { Models } from '../../../../interfaces/models';

@Component({
  selector: 'app-liderazgo-y-compromiso',
  standalone: true,
  imports: [CommonModule, LoadingComponent, FormsModule, ReactiveFormsModule, CardsBotonComponent, PasopasoComponent, PdfLiderazgoCompromisoComponent, UploadArchivosComponent, RouterLink, AlertaInformativoComponent, ReftourlPipe, LimpiarnombrePipe, FechafirestorePipe],
  templateUrl: './liderazgo-y-compromiso.component.html',
  schemas:[CUSTOM_ELEMENTS_SCHEMA],
  styleUrl: './liderazgo-y-compromiso.component.css'
})
export class LiderazgoYCompromisoComponent {

  nombreModulo: string = '004-liderazgo-compromiso';

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
  @ViewChild(PdfLiderazgoCompromisoComponent) crearPdf!: PdfLiderazgoCompromisoComponent;

  form!: FormGroup;
  openTab = 0;

  id_formulario: string = "0";
  dataEmpresa: string | null = sessionStorage.getItem('empresaData');
  dataEmpresa2: Models.Empresa.ConsultarEmpresa = JSON.parse(this.dataEmpresa ?? '{}');
  porcentaje = 0;

  userId: string | null = null;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private _asistente: AsistenteFormularioService,
  ){
    this.iniciarformulariolimpio();
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
      console.error('[LiderazgoCompromiso] eliminarVigente:', error);
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
    this.documento1 = docs['Liderazgo y compromiso'] ?? [];
    this.historico1 = hist['Liderazgo y compromiso'] ?? [];
    await this.actualizarEstatusGeneral();
  }

  private async actualizarEstatusGeneral(): Promise<void> {
    const modulo: Models.Procesos.Modulo004LiderazgoCompromiso = {
      total_progreso: this.documento1.length > 0 ? 100 : 0,
      actaLiderazgo: { total: this.documento1.length > 0 ? 1 : 0 },
    };
    await this._estatus.registrarProgreso('004-liderazgo-compromiso', modulo);
  }

  iniciarformulariolimpio() {
    this.form = this.fb.group({
      objetivo1: [false],
      objetivo2: [false],
      objetivo3: [false],
      objetivo4: [false],
      objetivo5: [false],
      objetivo6: [false],
      objetivo7: [false],
      objetivo8: [''],
    });
  }

  async toggleTabs(tabNumber: number, porce: string) {
    this.openTab = tabNumber;

    if(this.openTab > 1 && this.openTab < 3){

      if(this.openTab == 2){
        if (this.id_formulario !== "0") {
          const dataCruda = await this._asistente.getFormulario('004-liderazgo-compromiso', this.id_formulario);
          this.form.patchValue(dataCruda);
        } else {
          sessionStorage.setItem('id_formulario_liderazgo_compromiso', Date.now().toString());
          this.id_formulario = sessionStorage.getItem('id_formulario_liderazgo_compromiso') as string;
        }
      }

      if (porce === "Avanza") {
        this.porcentaje = Math.min(this.porcentaje + 20, 100);
        this.pasoPaso.nextStep();
      } else if(porce === "Atras") {
        this.porcentaje = Math.max(this.porcentaje - 20, 0);
        this.pasoPaso.prevStep();
      }

      this._asistente.autoGuardar('004-liderazgo-compromiso', this.id_formulario ?? "", this.form.value, { estado: this.porcentaje });
    }
  }

  async onSubmit(){
    if (this.form.valid) {
      this.crearPdf.generatePdf(true);
      this.porcentaje = 100;
      this.toggleTabs(3, "");
    } else {
      this.form.markAllAsTouched();
    }
  }

  async vistaPrevia(){
    if (this.form.valid) {
      await this._asistente.autoGuardar('004-liderazgo-compromiso', this.id_formulario ?? "", this.form.value, { estado: 100 });
      this.crearPdf.generatePdf(true);
    } else {
      this.form.markAllAsTouched();
    }
  }

  irdashboard(){
    this.router.navigate(['admin/dashboardplanificar']);
  }
}
