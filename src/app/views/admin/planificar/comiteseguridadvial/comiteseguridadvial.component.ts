import { Component, inject, OnInit, ViewChild, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule, FormArray } from '@angular/forms';
// Componentes
import { PdfComiteSeguridadVialComponent } from '../../../../components/pdfs/pdf-comite-seguridad-vial/pdf-comite-seguridad-vial.component';
import { CardsBotonComponent } from "../../../../components/cards/cards-boton/cards-boton.component";
import { PasopasoComponent } from "../../../../components/tabs/pasopaso/pasopaso.component";
import { ProgressCircleComponent } from "../../../../components/otros/progress-circle/progress-circle.component";
import { ModalsGuiaComponent } from '../../../../components/modals/modals-guia/modals-guia.component';
import { UploadArchivosComponent } from "../../../../components/otros/upload-archivos/upload-archivos.component";
// Servicios
import { ComiteSeguridadVialService } from '../../../../services/shared/comite-seguridad-vial.service';
import { LoadingComponent } from "../../../../components/loading/loading/loading.component";
import { AuthenticacionService } from '../../../../services/shared/authenticacion.service';
import { AlertaService } from '../../../../services/shared/alerta.service';
import { GestionDocumentosService } from '../../../../services/shared/gestion-documentos.service';
import { FirestoreService } from '../../../../services/shared/firestore.service';
import { Models } from '../../../../interfaces/models';
import { ReftourlPipe } from '../../../../pipes/reftourl.pipe';
import { LimpiarnombrePipe } from '../../../../pipes/limpiarnombre.pipe';
import { FechafirestorePipe } from '../../../../pipes/fechafirestore.pipe';
import { AlertaInformativoComponent } from "../../../../components/alertas/alerta-informativo/alerta-informativo.component";


@Component({
  selector: 'app-comiteseguridadvial',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PdfComiteSeguridadVialComponent, CardsBotonComponent, PasopasoComponent, ProgressCircleComponent, ModalsGuiaComponent, UploadArchivosComponent, LoadingComponent, RouterLink, ReftourlPipe, LimpiarnombrePipe, FechafirestorePipe, AlertaInformativoComponent],
  templateUrl: './comiteseguridadvial.component.html',
  schemas:[CUSTOM_ELEMENTS_SCHEMA],
  styleUrl: './comiteseguridadvial.component.css'
})
export class ComiteseguridadvialComponent implements OnInit {

  nombreModulo: string = '002-comite-seguridad-vial';

  private _authcations = inject(AuthenticacionService);
  private _gestDoc = inject(GestionDocumentosService);
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
  @ViewChild(ModalsGuiaComponent) modalOkCancelar!: ModalsGuiaComponent;
  @ViewChild(PdfComiteSeguridadVialComponent) crearPdf!: PdfComiteSeguridadVialComponent;

  form!: FormGroup;
  firmas: FormArray;
  openTab = 0;
  integrantes: { nombreintegrante: string, cargo: string, rol: string, contacto: string }[] = [];

  id_formulario: string = "0";
  dataEmpresa: string | null = sessionStorage.getItem('empresaData');
  dataEmpresa2: Models.Empresa.ConsultarEmpresa = JSON.parse(this.dataEmpresa ?? '{}');
  porcentaje = 0;

  userId: string | null = null;
  isLoading = true;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private _comiteSeguVial: ComiteSeguridadVialService,
  ) {
    this.iniciarformulariolimpio();
    this.firmas = this.form.get('firmas') as FormArray;
  }

  ngOnInit(): void {
    this.id_formulario = sessionStorage.getItem('id_formulario_comite_s_vial') || "0";
    if (this.id_formulario !== "0"){
      setTimeout(() => {
        if (this.modalOkCancelar) {
          this.modalOkCancelar.abrirModal();
        }
      }, 0);
    }
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
    this.documento1 = docs['Comité de Seguridad Vial'] ?? [];
    this.historico1 = hist['Comité de Seguridad Vial'] ?? [];
    await this.actualizarEstatusGeneral();
  }

  private async actualizarEstatusGeneral(): Promise<void> {
    const periodo = this._authcations.periodo();
    const modulo: Models.Procesos.Modulo002ComiteSeguridad = {
      total_progreso: this.documento1.length > 0 ? 100 : 0,
      actacomite: { total: this.documento1.length > 0 ? 1 : 0 },
    };
    try {
      await this._firestore.upsertDocument(`EstatusGeneral/${this.nit}`, {
        periodo,
        '002-comite-seguridad-vial-documentos': modulo,
      });
    } catch (error: unknown) {
      console.error('[ComiteSeguridad] actualizarEstatusGeneral:', error);
    }
  }

  iniciarformulariolimpio() {
    this.form = this.fb.group({
      departamento: ['', Validators.required],
      ciudad: ['', Validators.required],
      fechaDocumento: ['', Validators.required],
      objetivo1: [false, Validators.required],
      objetivo2: [''],
      objetivo3: [''],
      objetivo4: [''],
      objetivo5: [''],
      opcion1: [false],
      opcion2: [false],
      opcion3: [false],
      opcion4: [false],
      opcion5: [false],
      opcion6: [false],
      opcion7: [false],
      opcion8: [false],
      opcion9: [false],
      opcion10: [false],
      opcion11: [false],
      opcion12: [false],
      opcion13: [false],
      opcion14: [false],
      opcion15: [false],
      opcion16: [false],
      opcion17: [false],
      firmas: this.fb.array([]),
      nuevoIntegrante: this.fb.group({
        nombreintegrante: [''],
        cargo: [''],
        rol: [''],
        contacto: ['']
      })
    });
  }

  async toggleTabs(tabNumber: number, porce: string) {
    this.openTab = tabNumber;

    if(this.openTab > 1 && this.openTab < 6){

      if(this.openTab == 2){
        if (this.id_formulario !== "0") {
          const dataCruda: any = await this._comiteSeguVial.getfomularioEdit(this.id_formulario);
          this.integrantes = dataCruda['integrantes'] ?? [];

          if (this.firmas.length === 0) {
            for (let i = 0; i < this.integrantes.length; i++) {
              this.firmas.push(this.fb.group({ firma: [''] }));
            }
          }

          this.form.patchValue(dataCruda);
        } else {
          sessionStorage.setItem('id_formulario_comite_s_vial', Date.now().toString());
          this.id_formulario = sessionStorage.getItem('id_formulario_comite_s_vial') as string;
        }
      }

      if (porce === "Avanza") {
        this.porcentaje = Math.min(this.porcentaje + 20, 100);
        this.pasoPaso.nextStep();
      } else if(porce === "Atras") {
        this.porcentaje = Math.max(this.porcentaje - 20, 0);
        this.pasoPaso.prevStep();
      }

      const { nuevoIntegrante, ...restoFormData } = this.form.value;
      const formData = { ...restoFormData, integrantes: this.integrantes };
      this._comiteSeguVial.autoGuardar(formData, "Asistente", this.porcentaje, this.id_formulario ?? "");
    }
  }

  addIntegrante(): void {
    const nuevoIntegrante = this.form.get('nuevoIntegrante')?.value;
    if (nuevoIntegrante.nombreintegrante && nuevoIntegrante.rol && nuevoIntegrante.contacto) {
      this.integrantes.push({ ...nuevoIntegrante });
      this.form.get('nuevoIntegrante')?.reset();
      this.firmas.push(this.fb.group({ firma: [''] }));
    } else {
      alert('Por favor, complete todos los campos de integrante.');
    }
  }

  removeIntegrante(index: number): void {
    this.integrantes.splice(index, 1);
    this.firmas.removeAt(index);
  }

  async onSubmit(){
    if (this.form.valid) {
      const { nuevoIntegrante, ...restoFormData } = this.form.value;
      const formData = { ...restoFormData, integrantes: this.integrantes };
      this.porcentaje = 100;
      this.crearPdf.generatePdf(true);
      this.toggleTabs(6, 'Avanza');
    } else {
      alert('Por favor, complete todos los campos principales.');
    }
  }

  irdashboard(){
    this.router.navigate(['admin/dashboardplanificar']);
  }

  avanzarPaso() { this.pasoPaso.nextStep(); }
  retrocederPaso() { this.pasoPaso.prevStep(); }

  borroSessionIdFormulario(){
    sessionStorage.removeItem('id_formulario_comite_s_vial');
    this.id_formulario = "0";
  }
}
