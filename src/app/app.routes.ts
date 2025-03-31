import { Routes } from '@angular/router';
//import { LoginComponent } from './pages/login/login.component';
import { authGuard } from './guards/auth.guard';
//import { DashboardComponent } from './pages/dashboard/dashboard.component';

import { DashboardComponent } from './views/admin/dashboard/dashboard.component';
import { IndexComponent } from './views/index/index.component';
import { LandingComponent } from './views/landing/landing.component';
import { ProfileComponent } from './views/profile/profile.component';

import { AuthComponent } from './layouts/auth/auth.component';
import { RegisterComponent } from './views/auth/register/register.component';



import { AdminComponent } from './layouts/admin/admin.component';
import { LoginComponent } from './views/auth/login/login.component';
import { SettingsComponent } from './views/admin/settings/settings.component';
import { TablesComponent } from './views/admin/tables/tables.component';
import { MapsComponent } from './views/admin/maps/maps.component';
import { DashboardplanificarComponent } from './views/admin/dashboardplanificar/dashboardplanificar.component';
import { PlanificarComponent } from './views/admin/planificar/planificar.component';
import { EvaluacionComponent } from './views/admin/planificar/evaluacion/evaluacion.component';
import { DiagnosticoComponent } from './views/admin/planificar/diagnostico/diagnostico.component';
import { SociodemografiaComponent } from './views/admin/planificar/diagnostico/sociodemografia/sociodemografia.component';
import { MovilidadComponent } from './views/admin/planificar/diagnostico/movilidad/movilidad.component';
import { FactorRiesgoComponent } from './views/admin/planificar/diagnostico/factor-riesgo/factor-riesgo.component';
import { AccidentalidadComponent } from './views/admin/planificar/diagnostico/accidentalidad/accidentalidad.component';
import { EncuestasComponent } from './views/admin/planificar/diagnostico/encuestas/encuestas.component';
import { EvidenciasComponent } from './views/admin/planificar/diagnostico/evidencias/evidencias.component';
import { ProgramasComponent } from './views/admin/planificar/programas/programas.component';
import { MatrizLegalComponent } from './views/admin/planificar/matriz-legal/matriz-legal.component';
import { InicioComponent } from './views/admin/inicio/inicio.component';
import { LiderDelPesvComponent } from './views/admin/planificar/lider-del-pesv/lider-del-pesv.component';
import { ComiteseguridadvialComponent } from './views/admin/planificar/comiteseguridadvial/comiteseguridadvial.component';
import { PoliticaseguridadvialComponent } from './views/admin/planificar/politicaseguridadvial/politicaseguridadvial.component';
import { LiderazgoYCompromisoComponent } from './views/admin/planificar/liderazgo-y-compromiso/liderazgo-y-compromiso.component';
import { ObjetivosMetasComponent } from './views/admin/planificar/objetivos-metas/objetivos-metas.component';
import { PerfilComponent } from './views/admin/perfil/perfil.component';
import { PerfilEmpresaComponent } from './views/admin/perfil-empresa/perfil-empresa.component';
import { RestoreComponent } from './views/auth/restore/restore.component';
import { FirmasComponent } from './views/admin/firmas/firmas.component';
import { HacerComponent } from './views/admin/hacer/hacer.component';
import { VerificarComponent } from './views/admin/verificar/verificar.component';
import { ActuarComponent } from './views/admin/actuar/actuar.component';
import { DesarrolloComponent } from './components/desarrollo/desarrollo.component';
import { ZGestionArchivosComponent } from './views/admin/planificar/diagnostico/z-gestion-archivos/z-gestion-archivos.component';
import { GestionArchivosComponent } from './views/admin/planificar/lider-del-pesv/gestion-archivos/gestion-archivos.component';
import { GestionArchivos2Component } from './views/admin/planificar/comiteseguridadvial/gestion-archivos2/gestion-archivos2.component';
import { GestionArchivos3Component } from './views/admin/planificar/politicaseguridadvial/gestion-archivos3/gestion-archivos3.component';
import { GestionArchivos4Component } from './views/admin/planificar/liderazgo-y-compromiso/gestion-archivos4/gestion-archivos4.component';
import { GestionArchivos6Component } from './views/admin/planificar/evaluacion/gestion-archivos6/gestion-archivos6.component';
import { GestionArchivos7Component } from './views/admin/planificar/objetivos-metas/gestion-archivos7/gestion-archivos7.component';
import { GestionArchivos8Component } from './views/admin/planificar/programas/gestion-archivos8/gestion-archivos8.component';
import { GestionArchivos9Component } from './views/admin/planificar/actas-reunion-comite/gestion-archivos9/gestion-archivos9.component';
import { GestionArchivos10Component } from './views/admin/planificar/matriz-legal/gestion-archivos10/gestion-archivos10.component';
import { ActasReunionComiteComponent } from './views/admin/planificar/actas-reunion-comite/actas-reunion-comite.component';
import { InformeDiagnosticoComponent } from './views/admin/planificar/diagnostico/informe-diagnostico/informe-diagnostico.component';
import { MapaColombiaComponent } from './components/apexChart/mapa-colombia/mapa-colombia.component';
import { PlanAnualTrabajoComponent } from './views/admin/hacer/plan-anual-trabajo/plan-anual-trabajo.component';
import { GestionArchivos11Component } from './views/admin/hacer/plan-anual-trabajo/gestion-archivos11/gestion-archivos11.component';
import { CompetenciasPlanAnualFormacionComponent } from './views/admin/hacer/competencias-plan-anual-formacion/competencias-plan-anual-formacion.component';
import { ResponsabilidadComportamientoSeguroComponent } from './views/admin/hacer/responsabilidad-comportamiento-seguro/responsabilidad-comportamiento-seguro.component';
import { PreparacionRespuestaEmergenciasVialesComponent } from './views/admin/hacer/preparacion-respuesta-emergencias-viales/preparacion-respuesta-emergencias-viales.component';
import { InvestigacionIncidentesVialesComponent } from './views/admin/hacer/investigacion-incidentes-viales/investigacion-incidentes-viales.component';
import { ViasSegurasAdministadasOrganizacionComponent } from './views/admin/hacer/vias-seguras-administadas-organizacion/vias-seguras-administadas-organizacion.component';
import { PlanificacionDesplazamientosLaboralesComponent } from './views/admin/hacer/planificacion-desplazamientos-laborales/planificacion-desplazamientos-laborales.component';
import { InspeccionVehiculosEquiposComponent } from './views/admin/hacer/inspeccion-vehiculos-equipos/inspeccion-vehiculos-equipos.component';
import { MantenimientoControlVehiculosSegurosComponent } from './views/admin/hacer/mantenimiento-control-vehiculos-seguros/mantenimiento-control-vehiculos-seguros.component';
import { GestionCambioContratistasComponent } from './views/admin/hacer/gestion-cambio-contratistas/gestion-cambio-contratistas.component';
import { ArchivoRetencionDocumentalComponent } from './views/admin/hacer/archivo-retencion-documental/archivo-retencion-documental.component';
import { GestionArchivos12Component } from './views/admin/hacer/competencias-plan-anual-formacion/gestion-archivos12/gestion-archivos12.component';
import { GestionArchivos13Component } from './views/admin/hacer/responsabilidad-comportamiento-seguro/gestion-archivos13/gestion-archivos13.component';
import { GestionArchivos14Component } from './views/admin/hacer/preparacion-respuesta-emergencias-viales/gestion-archivos14/gestion-archivos14.component';
import { GestionArchivos15Component } from './views/admin/hacer/investigacion-incidentes-viales/gestion-archivos15/gestion-archivos15.component';
import { GestionArchivos16Component } from './views/admin/hacer/vias-seguras-administadas-organizacion/gestion-archivos16/gestion-archivos16.component';
import { GestionArchivos17Component } from './views/admin/hacer/planificacion-desplazamientos-laborales/gestion-archivos17/gestion-archivos17.component';
import { GestionArchivos18Component } from './views/admin/hacer/inspeccion-vehiculos-equipos/gestion-archivos18/gestion-archivos18.component';
import { GestionArchivos19Component } from './views/admin/hacer/mantenimiento-control-vehiculos-seguros/gestion-archivos19/gestion-archivos19.component';
import { GestionArchivos20Component } from './views/admin/hacer/gestion-cambio-contratistas/gestion-archivos20/gestion-archivos20.component';
import { GestionArchivos21Component } from './views/admin/hacer/archivo-retencion-documental/gestion-archivos21/gestion-archivos21.component';
import { IndicadoresAutogestionPesvComponent } from './views/admin/verificar/indicadores-autogestion-pesv/indicadores-autogestion-pesv.component';
import { RegistroSiniestrosVialesComponent } from './views/admin/verificar/registro-siniestros-viales/registro-siniestros-viales.component';
import { AuditoriaAnualComponent } from './views/admin/verificar/auditoria-anual/auditoria-anual.component';
import { GestionArchivos22Component } from './views/admin/verificar/indicadores-autogestion-pesv/gestion-archivos22/gestion-archivos22.component';
import { GestionArchivos23Component } from './views/admin/verificar/registro-siniestros-viales/gestion-archivos23/gestion-archivos23.component';
import { GestionArchivos24Component } from './views/admin/verificar/auditoria-anual/gestion-archivos24/gestion-archivos24.component';
import { MejoraAccionesPreventivasCorrectivasComponent } from './views/admin/actuar/mejora-acciones-preventivas-correctivas/mejora-acciones-preventivas-correctivas.component';
import { MecanismosComunicacionComponent } from './views/admin/actuar/mecanismos-comunicacion/mecanismos-comunicacion.component';
import { GestionArchivos25Component } from './views/admin/actuar/mejora-acciones-preventivas-correctivas/gestion-archivos25/gestion-archivos25.component';
import { GestionArchivos26Component } from './views/admin/actuar/mecanismos-comunicacion/gestion-archivos26/gestion-archivos26.component';



// Rutas principales
export const routes: Routes = [
  // Rutas del layout de autenticación
  {
    path: 'auth',
    component: AuthComponent,
    children: [
      { path: 'login', component: LoginComponent },
      { path: 'register', component: RegisterComponent },
      { path: 'reset', component: RestoreComponent },
      { path: "", redirectTo: "login", pathMatch: "full" },
    ],
  },

  // Rutas del layout de admin
  {
    path: "admin",
    component: AdminComponent,
    canActivate: [authGuard],  // Protege todo el grupo
    children: [
      
      { path: "dashboard", component: DashboardComponent },
      { path: "perfil", component: PerfilComponent },
      { path: "gestor_firmas", component: FirmasComponent },
      { path: "desarrollo", component: DesarrolloComponent },
      { path: "maps", component: MapsComponent },
      //Planificar
      { path: "planificar",
        component: PlanificarComponent,
      },
      { path: "planificar/liderdelpesv", component: LiderDelPesvComponent,},
      { path: "planificar/liderdelpesv/gestion_archivos", component: GestionArchivosComponent },
      { path: "planificar/comiteseguridadvial", component: ComiteseguridadvialComponent },
      { path: "planificar/comiteseguridadvial/gestion_archivos", component: GestionArchivos2Component },
      { path: "planificar/politicaseguridadvial", component: PoliticaseguridadvialComponent },
      { path: "planificar/politicaseguridadvial/gestion_archivos", component: GestionArchivos3Component },
      { path: "planificar/liderazgo_y_compromiso", component: LiderazgoYCompromisoComponent },
      { path: "planificar/liderazgo_y_compromiso/gestion_archivos", component: GestionArchivos4Component },
      { path: "planificar/diagnostico", component: DiagnosticoComponent },
      { path: "planificar/diagnostico/informe_diagnostico", component: InformeDiagnosticoComponent },
      { path: "planificar/diagnostico/gestion_archivos", component: ZGestionArchivosComponent },
      { path: "planificar/diagnostico/sociodemografia", component: SociodemografiaComponent },
      { path: "planificar/diagnostico/mapa", component: MapaColombiaComponent },
      { path: "planificar/diagnostico/movilidad", component: MovilidadComponent },
      { path: "planificar/diagnostico/factor_riesgo", component: FactorRiesgoComponent },
      { path: "planificar/diagnostico/accidentalidad", component: AccidentalidadComponent },
      { path: "planificar/diagnostico/encuestas", component: EncuestasComponent },
      { path: "planificar/diagnostico/evidencias", component: EvidenciasComponent },
      { path: "planificar/evaluacion_y_control_riesgos", component: EvaluacionComponent },
      { path: "planificar/evaluacion_y_control_riesgos/gestion_archivos", component: GestionArchivos6Component },
      { path: "planificar/objetivos_y_metas", component: ObjetivosMetasComponent },
      { path: "planificar/objetivos_y_metas/gestion_archivos", component: GestionArchivos7Component },
      { path: "planificar/programas_gestion_riesgos", component: ProgramasComponent, },
      { path: "planificar/programas_gestion_riesgos/gestion_archivos", component: GestionArchivos8Component },
      { path: "planificar/actas_reunion_comite", component: ActasReunionComiteComponent, },
      { path: "planificar/actas_reunion_comite/gestion_archivos", component: GestionArchivos9Component },
      { path: "planificar/matriz_legal", component: MatrizLegalComponent, },
      { path: "planificar/matriz_legal/gestion_archivos", component: GestionArchivos10Component },    
     
      //Hacer
      { path: "hacer", component: HacerComponent },
      { path: "hacer/plan_anual_trabajo", component: PlanAnualTrabajoComponent, },
      { path: "hacer/plan_anual_trabajo/gestion_archivos", component: GestionArchivos11Component, },
      { path: "hacer/competencias_plan_anual_formacion", component: CompetenciasPlanAnualFormacionComponent, },
      { path: "hacer/competencias_plan_anual_formacion/gestion_archivos", component: GestionArchivos12Component, },
      { path: "hacer/responsabilidad_comportamiento_seguro", component: ResponsabilidadComportamientoSeguroComponent, },
      { path: "hacer/responsabilidad_comportamiento_seguro/gestion_archivos", component: GestionArchivos13Component, },
      { path: "hacer/preparacion_respuesta_emergencias_viales", component: PreparacionRespuestaEmergenciasVialesComponent, },
      { path: "hacer/preparacion_respuesta_emergencias_viales/gestion_archivos", component: GestionArchivos14Component, },
      { path: "hacer/investigacion_incidentes_viales", component: InvestigacionIncidentesVialesComponent, },
      { path: "hacer/investigacion_incidentes_viales/gestion_archivos", component: GestionArchivos15Component, },
      { path: "hacer/vias_seguras_administradas_organizacion", component: ViasSegurasAdministadasOrganizacionComponent, },
      { path: "hacer/vias_seguras_administradas_organizacion/gestion_archivos", component: GestionArchivos16Component, },
      { path: "hacer/planificacion_desplazamientos_laborales", component: PlanificacionDesplazamientosLaboralesComponent, },
      { path: "hacer/planificacion_desplazamientos_laborales/gestion_archivos", component: GestionArchivos17Component, },
      { path: "hacer/inspeccion_vehiculos_equipos", component: InspeccionVehiculosEquiposComponent, },
      { path: "hacer/inspeccion_vehiculos_equipos/gestion_archivos", component: GestionArchivos18Component, },
      { path: "hacer/mantenimiento_control_vehiculos_seguros", component: MantenimientoControlVehiculosSegurosComponent, },
      { path: "hacer/mantenimiento_control_vehiculos_seguros/gestion_archivos", component: GestionArchivos19Component, },
      { path: "hacer/gestion_cambio_contratistas", component: GestionCambioContratistasComponent, },
      { path: "hacer/gestion_cambio_contratistas/gestion_archivos", component: GestionArchivos20Component, },
      { path: "hacer/archivo_retencion_documental", component: ArchivoRetencionDocumentalComponent, },
      { path: "hacer/archivo_retencion_documental/gestion_archivos", component: GestionArchivos21Component, },
      //Verificar
      { path: "verificar", component: VerificarComponent },
      { path: "verificar/indicadores_autogestion_pesv", component: IndicadoresAutogestionPesvComponent, },
      { path: "verificar/indicadores_autogestion_pesv/gestion_archivos", component: GestionArchivos22Component, },
      { path: "verificar/registro_siniestros_viales", component: RegistroSiniestrosVialesComponent, },
      { path: "verificar/registro_siniestros_viales/gestion_archivos", component: GestionArchivos23Component, },
      { path: "verificar/auditoria_anual", component: AuditoriaAnualComponent, },
      { path: "verificar/auditoria_anual/gestion_archivos", component: GestionArchivos24Component, },
      //Actuar
      { path: "actuar", component: ActuarComponent },
      { path: "actuar/mejora_acciones_preventivas_correctivas", component: MejoraAccionesPreventivasCorrectivasComponent, },
      { path: "actuar/mejora_acciones_preventivas_correctivas/gestion_archivos", component: GestionArchivos25Component, },
      { path: "actuar/mecanismos_comunicacion", component: MecanismosComunicacionComponent, },
      { path: "actuar/mecanismos_comunicacion/gestion_archivos", component: GestionArchivos26Component, },
      
    ],
  },

  // Rutas protegidas (se requieren permisos con authGuard)
  { path: "starting", component: InicioComponent,  },
  // { path: 'dashboard1', component: DashboardComponent, canActivate: [authGuard] },
  // { path: 'login1', component: LoginComponent },
  // { path: 'actuar', component: ActuarComponent, canActivate: [authGuard] },
  // { path: 'hacer', component: HacerComponent, canActivate: [authGuard] },
  // { path: 'planear', component: PlanearComponent, canActivate: [authGuard] },
  // { path: 'verificar', component: VerificarComponent, canActivate: [authGuard] },

  // Rutas sin layout
  { path: 'index', component: IndexComponent },
  { path: 'landing', component: LandingComponent },
  { path: 'profile', component: ProfileComponent },

  // Redirección por defecto
  { path: '', redirectTo: '/auth/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/auth/login' }
];
