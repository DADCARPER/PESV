import { Component, OnInit, OnDestroy, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

// Subcomponentes del diagnóstico
import { SedesComponent } from './sedes/sedes.component';
import { ContratistasComponent } from './contratistas/contratistas.component';
import { ColaboradoresComponent } from './colaboradores/colaboradores.component';
import { EncuestaParametrosComponent } from './encuesta-parametros/encuesta-parametros.component';
import { ServiciosComponent } from './servicios/servicios.component';
import { VehiculosComponent } from './vehiculos/vehiculos.component';
import { RutasFrecuentesComponent } from './rutas-frecuentes/rutas-frecuentes.component';
import { PlanEmergenciasComponent } from './plan-emergencias/plan-emergencias.component';

// Componentes reutilizables
import { CardStats2Component } from '../../../../components/cards/card-stats2/card-stats2.component';
import { CardsMedicionBarraProgresoComponent } from '../../../../components/cards/cards-medicion-barra-progreso/cards-medicion-barra-progreso.component';
import { CrearColaboradoresComponent } from '../../../../components/modals/crear-colaboradores/crear-colaboradores.component';
import { ImportarColaboradoresComponent } from '../../../../components/modals/importar-colaboradores/importar-colaboradores.component';
import { LoadingComponent } from '../../../../components/loading/loading/loading.component';

// Servicios
import { AuthenticacionService } from '../../../../services/shared/authenticacion.service';
import { FirestoreService } from '../../../../services/shared/firestore.service';
import { SedesDiagnosticoService } from '../../../../services/shared/sedes-diagnostico.service';
import { AlertaService } from '../../../../services/shared/alerta.service';

// Interfaces
import { Models } from '../../../../interfaces/models';

@Component({
  selector: 'app-diagnostico',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterLink,
    SedesComponent, ContratistasComponent, ColaboradoresComponent, 
    EncuestaParametrosComponent, ServiciosComponent,
    VehiculosComponent, RutasFrecuentesComponent, PlanEmergenciasComponent,
    CardStats2Component, CardsMedicionBarraProgresoComponent,
    CrearColaboradoresComponent, ImportarColaboradoresComponent,
    LoadingComponent,
  ],
  templateUrl: './diagnostico.component.html',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  styleUrl: './diagnostico.component.css',
})
export class DiagnosticoComponent implements OnInit, OnDestroy {

  private _authcations = inject(AuthenticacionService);
  private _firestore = inject(FirestoreService);
  private _alerta = inject(AlertaService);

  nit = this._authcations.getCurrentUser().displayName;
  empresa = this._authcations.getCurrentUser().photoURL;
  uid = this._authcations.getCurrentUser().uid;

  // ── Estado del diagnóstico base ──────────────────────────────────────────
  diagnosticoBase: Models.Diagnostico.DiagnosticoBase | null = null;
  cargandoDiagnostico = true;

  // ── Modal crear diagnóstico ──────────────────────────────────────────────
  mostrarModal = false;
  guardando = false;
  formDiagnostico = {
    totalColaboradores: 0,
    descripcionEmpresa: '',
  };

  // ── Tabs del dashboard ───────────────────────────────────────────────────
  openTab = 0;

  // ── Estadísticas para el tablero ─────────────────────────────────────────
  num_sedes = 0;
  num_servicios = 0;
  num_contratista = 0;
  num_conductores = 0;
  num_empleados = 0;
  num_masculino = 0;
  num_femenino = 0;

  datosSedes: Models.Diagnostico.Sedes[] = [];
  datosColaboradores: Models.Diagnostico.Colaboradores[] = [];
  datosContratistas: Models.Diagnostico.Contratistas[] = [];
  datos006diagnosticoServicios: Models.Diagnostico.Servicio[] = [];
  datosCodunccion: any[] = [];
  datosCodunccionMisional: any[] = [];
  datosRiesgosViales: any[] = [];
  datosVehiculos: any[] = [];
  datosRutas: any[] = [];
  datosPlanEmergencias: any[] = [];

  num_vehiculos = 0;
  num_rutas = 0;

  private _subSedes?: Subscription;
  private _subServicios?: Subscription;
  private _subContratistas?: Subscription;
  private _subColaboradores?: Subscription;
  private _subVehiculos?: Subscription;
  private _subRutas?: Subscription;
  private _subPlanEmergencias?: Subscription;

  constructor(private _sedes: SedesDiagnosticoService) {}

  async ngOnInit() {
    await this.consultarDiagnosticoBase();
    this.cargarParametrosEncuesta();
    if (this.diagnosticoBase) {
      this.consultarSedes();
      this.consultarServicios();
      this.consultarContratistas();
      this.consultarColaboradores();
      this.consultarVehiculos();
      this.consultarRutas();
      this.consultarPlanEmergencias();
    }
  }

  // ── Diagnóstico base ─────────────────────────────────────────────────────

  async consultarDiagnosticoBase() {
    const periodo = this._authcations.periodo();
    const path = `Empresas/${this.nit}/periodos/${periodo}/006-diagnostico`;
    const q: Models.Firebases.whereQuery[] = [['estado', '==', 'Activo']];
    try {
      const snap = await this._firestore.getDocumentsQuery<Models.Diagnostico.DiagnosticoBase>(path, q);
      this.diagnosticoBase = snap.docs.length > 0
        ? (snap.docs[0].data() as Models.Diagnostico.DiagnosticoBase)
        : null;
    } catch (error: unknown) {
      console.error('[Diagnostico] consultarDiagnosticoBase:', error);
      this.diagnosticoBase = null;
    } finally {
      this.cargandoDiagnostico = false;
    }
  }

  abrirModal() {
    this.formDiagnostico = { totalColaboradores: 0, descripcionEmpresa: '' };
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
  }

  async guardarDiagnostico() {
    if (!this.formDiagnostico.descripcionEmpresa.trim()) {
      this._alerta.showError('La descripción de la empresa es obligatoria.');
      return;
    }
    this.guardando = true;
    try {
      const periodo = this._authcations.periodo();
      const now = new Date();
      const fechaCreacion = now.toLocaleDateString('es-CO', {
        year: 'numeric', month: '2-digit', day: '2-digit',
      }) + ' ' + now.toLocaleTimeString('es-CO', {
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
      });

      const doc: Models.Diagnostico.DiagnosticoBase = {
        totalColaboradores: this.formDiagnostico.totalColaboradores,
        descripcionEmpresa: this.formDiagnostico.descripcionEmpresa.trim(),
        fechaCreacion,
        version: 'v1',
        estado: 'En proceso',
        porcentajeTotal: 0,
        nitEmpresa: this.nit as string,
        periodo,
      };

      const path = `Empresas/${this.nit}/periodos/${periodo}/006-diagnostico`;
      await this._firestore.createDocument(path, doc);
      this._alerta.showSuccess('Diagnóstico creado exitosamente.');
      this.mostrarModal = false;
      await this.consultarDiagnosticoBase();
      this.consultarSedes();
      this.consultarServicios();
      this.consultarContratistas();
      this.consultarColaboradores();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error al crear el diagnóstico';
      console.error('[Diagnostico] guardarDiagnostico:', error);
      this._alerta.showError(msg);
    } finally {
      this.guardando = false;
    }
  }

  // ── Subscriptions del dashboard ──────────────────────────────────────────

  consultarSedes() {
    const periodo = this._authcations.periodo();
    const path = `Empresas/${this.nit}/periodos/${periodo}/006-diagnostico-sedes`;
    const q: Models.Firebases.whereQuery[] = [['estado', '==', 'Activo']];
    const extras: Models.Firebases.extrasQuery = { orderParam: 'docCreado', directionSort: 'desc', limit: 20 };
    this._subSedes = this._firestore.getDocumentsQueryChanges<Models.Diagnostico.Sedes>(path, q, extras).subscribe(res => {
      this.num_sedes = res.length;
      this.datosSedes = res;
    });
  }

  consultarServicios() {
    const periodo = this._authcations.periodo();
    const path = `Empresas/${this.nit}/periodos/${periodo}/006-diagnostico-servicios`;
    const q: Models.Firebases.whereQuery[] = [['estado', '==', 'Activo']];
    const extras: Models.Firebases.extrasQuery = { orderParam: 'docCreado', directionSort: 'desc', limit: 20 };
    this._subServicios = this._firestore.getDocumentsQueryChanges<Models.Diagnostico.Servicio>(path, q, extras).subscribe(res => {
      this.num_servicios = res.length;
      this.datos006diagnosticoServicios = res;
    });
  }

  consultarContratistas() {
    const periodo = this._authcations.periodo();
    const path = `Empresas/${this.nit}/periodos/${periodo}/006-diagnostico-contratistas`;
    const q: Models.Firebases.whereQuery[] = [['estado', '==', 'Activo']];
    const extras: Models.Firebases.extrasQuery = { orderParam: 'docCreado', directionSort: 'desc', limit: 20 };
    this._subContratistas = this._firestore.getDocumentsQueryChanges<Models.Diagnostico.Contratistas>(path, q, extras).subscribe(res => {
      this.num_contratista = res.length;
      this.datosContratistas = res;
      this.num_conductores = res.reduce((sum, e) => sum + (Number(e.conductores) || 0), 0);
    });
  }

  consultarColaboradores() {
    const periodo = this._authcations.periodo();
    const path = `Empresas/${this.nit}/periodos/${periodo}/006-diagnostico-colaboradores`;
    const q: Models.Firebases.whereQuery[] = [['estado', '==', 'Activo']];
    const extras: Models.Firebases.extrasQuery = { orderParam: 'docCreado', directionSort: 'desc', limit: 20 };
    this._subColaboradores = this._firestore.getDocumentsQueryChanges<Models.Diagnostico.Colaboradores>(path, q, extras).subscribe(res => {
      this.num_empleados = res.length;
      this.datosColaboradores = res;
      this.num_masculino = res.filter(e => e.genero === 'Masculino').length;
      this.num_femenino = res.filter(e => e.genero === 'Femenino').length;
    });
  }

  // ── Encuesta pública (inicialización) ────────────────────────────────────

  async cargarParametrosEncuesta() {
    const path = `Encuestas_publicas/${this.nit}`;
    try {
      const snap = await this._firestore.getDocument<Models.Diagnostico.encuestaParametros>(path);
      if (!snap.exists()) {
        await this._firestore.createDocument('Encuestas_publicas', {
          nombreEmpresa: this.empresa,
          encuestaParametros: {
            mostrarEncuesta: false,
            modulo2: false, modulo3: false,
            modulo4: false, modulo5: false, modulo6: false,
          },
        }, this.nit);
      }
    } catch (error: unknown) {
      console.error('[Diagnostico] cargarParametrosEncuesta:', error);
    }
  }

  toggleTabs(tabNumber: number) {
    this.openTab = tabNumber;
  }

  consultarVehiculos() {
    const periodo = this._authcations.periodo();
    const path = `Empresas/${this.nit}/periodos/${periodo}/006-diagnostico-vehiculos`;
    const q: Models.Firebases.whereQuery[] = [['estado', '==', 'Activo']];
    const extras: Models.Firebases.extrasQuery = { orderParam: 'docCreado', directionSort: 'desc', limit: 100 };
    this._subVehiculos = this._firestore.getDocumentsQueryChanges<any>(path, q, extras).subscribe(res => {
      this.num_vehiculos = res.length;
      this.datosVehiculos = res;
    });
  }

  consultarRutas() {
    const periodo = this._authcations.periodo();
    const path = `Empresas/${this.nit}/periodos/${periodo}/006-diagnostico-rutas`;
    const q: Models.Firebases.whereQuery[] = [['estado', '==', 'Activo']];
    const extras: Models.Firebases.extrasQuery = { orderParam: 'docCreado', directionSort: 'desc', limit: 100 };
    this._subRutas = this._firestore.getDocumentsQueryChanges<any>(path, q, extras).subscribe(res => {
      this.num_rutas = res.length;
      this.datosRutas = res;
    });
  }

  consultarPlanEmergencias() {
    const periodo = this._authcations.periodo();
    const path = `Empresas/${this.nit}/periodos/${periodo}/006-diagnostico-plan-emergencias`;
    const q: Models.Firebases.whereQuery[] = [['estado', '==', 'Activo']];
    const extras: Models.Firebases.extrasQuery = { orderParam: 'docCreado', directionSort: 'desc', limit: 100 };
    this._subPlanEmergencias = this._firestore.getDocumentsQueryChanges<any>(path, q, extras).subscribe(res => {
      this.datosPlanEmergencias = res;
    });
  }

  ngOnDestroy() {
    this._subSedes?.unsubscribe();
    this._subServicios?.unsubscribe();
    this._subContratistas?.unsubscribe();
    this._subColaboradores?.unsubscribe();
    this._subVehiculos?.unsubscribe();
    this._subRutas?.unsubscribe();
    this._subPlanEmergencias?.unsubscribe();
  }
}
