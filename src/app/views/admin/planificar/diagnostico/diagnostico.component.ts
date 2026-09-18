import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { debounceTime } from 'rxjs';

// Subcomponentes del diagnóstico
import { SedesComponent } from './sedes/sedes.component';
import { ContratistasComponent } from './contratistas/contratistas.component';
import { ColaboradoresComponent } from './colaboradores/colaboradores.component';
import { EncuestaParametrosComponent } from './encuesta-parametros/encuesta-parametros.component';
import { ServiciosComponent } from './servicios/servicios.component';
import { VehiculosComponent } from './vehiculos/vehiculos.component';
import { RutasFrecuentesComponent } from './rutas-frecuentes/rutas-frecuentes.component';
import { PlanEmergenciasComponent } from './plan-emergencias/plan-emergencias.component';
import { ResultadosEncuestaComponent } from './resultados-encuesta/resultados-encuesta.component';

// Componentes reutilizables
import { CardStats2Component } from '../../../../components/cards/card-stats2/card-stats2.component';
import { CardsMedicionBarraProgresoComponent } from '../../../../components/cards/cards-medicion-barra-progreso/cards-medicion-barra-progreso.component';
import { LoadingComponent } from '../../../../components/loading/loading/loading.component';

// Servicios
import { AuthenticacionService } from '../../../../services/shared/authenticacion.service';
import { EmpresaService } from '../../../../services/shared/empresa.service';
import { FirestoreService } from '../../../../services/shared/firestore.service';
import { AlertaService } from '../../../../services/shared/alerta.service';
import {
  DiagnosticoDatosService, ListaDiagnostico, ResumenDiagnostico, SeccionDiagnostico,
} from '../../../../services/shared/diagnostico-datos.service';

// Interfaces
import { Models } from '../../../../interfaces/models';

/** Qué sección alimenta cada pestaña. El tablero (0) no tiene listado propio. */
const SECCION_POR_PESTANA: Record<number, SeccionDiagnostico> = {
  1: 'sedes',
  2: 'servicios',
  3: 'colaboradores',
  4: 'contratistas',
  5: 'vehiculos',
  6: 'rutas',
  7: 'plan-emergencias',
};

@Component({
  selector: 'app-diagnostico',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterLink,
    SedesComponent, ContratistasComponent, ColaboradoresComponent,
    EncuestaParametrosComponent, ServiciosComponent,
    VehiculosComponent, RutasFrecuentesComponent, PlanEmergenciasComponent,
    ResultadosEncuestaComponent,
    CardStats2Component, CardsMedicionBarraProgresoComponent,
    LoadingComponent,
  ],
  templateUrl: './diagnostico.component.html',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  styleUrl: './diagnostico.component.css',
})
export class DiagnosticoComponent implements OnInit {

  private _auth = inject(AuthenticacionService);
  private _empresaSrv = inject(EmpresaService);
  private _firestore = inject(FirestoreService);
  private _alerta = inject(AlertaService);
  private _datos = inject(DiagnosticoDatosService);
  private _destroyRef = inject(DestroyRef);

  readonly nit = this._empresaSrv.nit;

  /** Razón social, leída de Empresas/{nit} y no de photoURL de Auth. */
  get empresa(): string {
    return this._empresaSrv.nombre();
  }

  // ── Estado del diagnóstico base ──────────────────────────────────────────
  diagnosticoBase: Models.Diagnostico.DiagnosticoBase | null = null;
  cargandoDiagnostico = true;

  /**
   * Por qué no se pudo comprobar si ya existe un diagnóstico.
   *
   * Es distinto de "no hay ninguno": si una lectura falla y se trata como que
   * no existe, la pantalla invita a crear uno y la empresa acaba con dos
   * diagnósticos activos en el mismo periodo.
   */
  errorDiagnostico = signal('');

  // ── Modal crear diagnóstico ──────────────────────────────────────────────
  mostrarModal = false;
  guardando = false;
  formDiagnostico = {
    totalColaboradores: 0,
    descripcionEmpresa: '',
  };

  // ── Tabs del dashboard ───────────────────────────────────────────────────
  openTab = 0;

  /**
   * Cifras del tablero. Salen de consultas de conteo, no de contar filas
   * descargadas, así que reflejan el total real aunque la lista de la pestaña
   * solo tenga cargados los primeros cien.
   */
  resumen = signal<ResumenDiagnostico | null>(null);

  /**
   * Una lista por sección, cada una con su propio cursor de paginación. Se
   * llenan al abrir su pestaña, no al entrar al módulo.
   */
  readonly listas: Record<SeccionDiagnostico, ListaDiagnostico<any>> = {
    'sedes': this._datos.lista<Models.Diagnostico.Sedes>('sedes'),
    'servicios': this._datos.lista<Models.Diagnostico.Servicio>('servicios'),
    'colaboradores': this._datos.lista<Models.Diagnostico.Colaboradores>('colaboradores'),
    'contratistas': this._datos.lista<Models.Diagnostico.Contratistas>('contratistas'),
    'vehiculos': this._datos.lista<any>('vehiculos'),
    'rutas': this._datos.lista<any>('rutas'),
    'plan-emergencias': this._datos.lista<any>('plan-emergencias'),
  };

  async ngOnInit() {
    this.escucharEscrituras();
    await this._empresaSrv.cargar();
    await this.consultarDiagnosticoBase();
    this.cargarParametrosEncuesta();
    if (this.diagnosticoBase) await this.cargarResumen();
  }

  /**
   * Mantiene la pantalla al día cuando alguien crea, edita o borra.
   *
   * Los formularios y los modales escriben directamente en Firestore y antes
   * se apoyaban en las suscripciones en tiempo real para que la tabla se
   * refrescara sola. Al quitarlas hacía falta otra señal: el servicio de
   * Firestore avisa de cada escritura y aquí se traduce a qué sección recargar.
   */
  private escucharEscrituras() {
    this._firestore.escrituras
      .pipe(
        // La importación de Excel crea un documento por fila. Sin esperar a
        // que la ráfaga termine se lanzaría una recarga por cada colaborador.
        debounceTime(500),
        takeUntilDestroyed(this._destroyRef)
      )
      .subscribe((path) => {
        const seccion = this._datos.seccionDeRuta(path);
        if (!seccion) return;

        // Solo se recarga lo que ya se había abierto; el resto se traerá
        // cuando se abra, y el resumen siempre, porque el tablero lo muestra.
        if (this.listas[seccion].cargada()) {
          this.listas[seccion].recargar().catch(() => undefined);
        }
        this.cargarResumen();
      });
  }

  // ── Diagnóstico base ─────────────────────────────────────────────────────

  async consultarDiagnosticoBase() {
    this.errorDiagnostico.set('');
    try {
      this.diagnosticoBase = await this._datos.diagnosticoBase();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'No se pudo comprobar el diagnóstico';
      console.error('[Diagnostico] consultarDiagnosticoBase:', error);
      this.diagnosticoBase = null;
      this.errorDiagnostico.set(msg);
    } finally {
      this.cargandoDiagnostico = false;
    }
  }

  /** Reintenta la comprobación inicial tras un fallo de lectura. */
  async reintentar() {
    this.cargandoDiagnostico = true;
    await this.consultarDiagnosticoBase();
    if (this.diagnosticoBase) await this.cargarResumen();
  }

  /** Las cifras del tablero: una lectura por cifra, sin descargar listados. */
  async cargarResumen() {
    try {
      this.resumen.set(await this._datos.resumen());
    } catch (error: unknown) {
      console.error('[Diagnostico] cargarResumen:', error);
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
      const periodo = this._auth.periodo();
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
        nitEmpresa: this.nit(),
        periodo,
      };

      await this._firestore.createDocument(this._datos.rutaBase(), doc);
      this._alerta.showSuccess('Diagnóstico creado exitosamente.');
      this.mostrarModal = false;
      await this.consultarDiagnosticoBase();
      await this.cargarResumen();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error al crear el diagnóstico';
      console.error('[Diagnostico] guardarDiagnostico:', error);
      this._alerta.showError(msg);
    } finally {
      this.guardando = false;
    }
  }

  // ── Pestañas ─────────────────────────────────────────────────────────────

  /**
   * Cambia de pestaña y, la primera vez, trae su listado.
   *
   * Antes el módulo abría de golpe siete suscripciones en tiempo real al
   * entrar, aunque solo se mirara el tablero. Ahora cada sección se paga
   * cuando se abre, y volver a ella no cuesta nada.
   */
  toggleTabs(tabNumber: number) {
    this.openTab = tabNumber;

    const seccion = SECCION_POR_PESTANA[tabNumber];
    if (!seccion) return;

    this.listas[seccion].cargar().catch(() => {
      this._alerta.showError('No se pudo cargar la información de esta sección.');
    });
  }

  /** Trae el siguiente tramo de la sección que se está mirando. */
  cargarMas(seccion: SeccionDiagnostico) {
    this.listas[seccion].cargarMas().catch(() => {
      this._alerta.showError('No se pudieron cargar más registros.');
    });
  }

  /**
   * Refresca una sección tras crear, editar o borrar en ella, y actualiza las
   * cifras del tablero para que no queden desfasadas.
   */
  async refrescar(seccion: SeccionDiagnostico) {
    await this.listas[seccion].recargar();
    await this.cargarResumen();
  }

  // ── Encuesta pública (inicialización) ────────────────────────────────────

  async cargarParametrosEncuesta() {
    const nit = this.nit();
    if (!nit) return;
    try {
      const snap = await this._firestore.getDocument<Models.Diagnostico.encuestaParametros>(
        `Encuestas_publicas/${nit}`
      );
      if (!snap.exists()) {
        await this._firestore.createDocument('Encuestas_publicas', {
          nombreEmpresa: this.empresa,
          encuestaParametros: {
            mostrarEncuesta: false,
            modulo2: false, modulo3: false,
            modulo4: false, modulo5: false, modulo6: false,
          },
        }, nit);
      }
    } catch (error: unknown) {
      console.error('[Diagnostico] cargarParametrosEncuesta:', error);
    }
  }

  // ── Atajos para la plantilla ─────────────────────────────────────────────

  get num_sedes() { return this.resumen()?.sedes ?? 0; }
  get num_servicios() { return this.resumen()?.servicios ?? 0; }
  get num_empleados() { return this.resumen()?.colaboradores ?? 0; }
  get num_contratista() { return this.resumen()?.contratistas ?? 0; }
  get num_vehiculos() { return this.resumen()?.vehiculos ?? 0; }
  get num_rutas() { return this.resumen()?.rutas ?? 0; }
  get num_planes() { return this.resumen()?.planEmergencias ?? 0; }
  get num_conductores() { return this.resumen()?.conductores ?? 0; }
  get num_masculino() { return this.resumen()?.masculino ?? 0; }
  get num_femenino() { return this.resumen()?.femenino ?? 0; }

  get datosSedes() { return this.listas['sedes'].datos(); }
  get datos006diagnosticoServicios() { return this.listas['servicios'].datos(); }
  get datosColaboradores() { return this.listas['colaboradores'].datos(); }
  get datosContratistas() { return this.listas['contratistas'].datos(); }
  get datosVehiculos() { return this.listas['vehiculos'].datos(); }
  get datosRutas() { return this.listas['rutas'].datos(); }
  get datosPlanEmergencias() { return this.listas['plan-emergencias'].datos(); }
}
