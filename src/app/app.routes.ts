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
import { LoginComponent } from './pages/login/login.component';


import { AdminComponent } from './layouts/admin/admin.component';

import { SettingsComponent } from './views/admin/settings/settings.component';
import { TablesComponent } from './views/admin/tables/tables.component';
import { MapsComponent } from './views/admin/maps/maps.component';
import { DashboardplanificarComponent } from './views/admin/dashboardplanificar/dashboardplanificar.component';
import { PlanificarComponent } from './views/admin/planificar/planificar.component';
import { ResponsabilidadComponent } from './views/admin/planificar/responsabilidad/responsabilidad.component';
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
import { LiderDelPesvComponent } from './views/admin/planificar/responsabilidad/lider-del-pesv/lider-del-pesv.component';
import { ComiteseguridadvialComponent } from './views/admin/planificar/responsabilidad/comiteseguridadvial/comiteseguridadvial.component';
import { PoliticaseguridadvialComponent } from './views/admin/planificar/responsabilidad/politicaseguridadvial/politicaseguridadvial.component';
import { LiderazgoYCompromisoComponent } from './views/admin/planificar/responsabilidad/liderazgo-y-compromiso/liderazgo-y-compromiso.component';
import { ObjetivosMetasComponent } from './views/admin/planificar/responsabilidad/objetivos-metas/objetivos-metas.component';
import { PerfilComponent } from './views/admin/perfil/perfil.component';
import { PerfilEmpresaComponent } from './views/admin/perfil-empresa/perfil-empresa.component';
import { RestoreComponent } from './views/auth/restore/restore.component';
import { FirmasComponent } from './views/admin/firmas/firmas.component';
import { HacerComponent } from './views/admin/hacer/hacer.component';
import { VerificarComponent } from './views/admin/verificar/verificar.component';
import { ActuarComponent } from './views/admin/actuar/actuar.component';
import { DesarrolloComponent } from './components/desarrollo/desarrollo.component';
import { ZGestionArchivosComponent } from './views/admin/planificar/diagnostico/z-gestion-archivos/z-gestion-archivos.component';


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
      //Planificar
      { path: "planificar", component: PlanificarComponent },
      { path: "planificar/responsabilidad", component: ResponsabilidadComponent },
      { path: "planificar/responsabilidad/liderdelpesv", component: LiderDelPesvComponent },
      { path: "planificar/responsabilidad/comiteseguridadvial", component: ComiteseguridadvialComponent },
      { path: "planificar/responsabilidad/politicaseguridadvial", component: PoliticaseguridadvialComponent },
      { path: "planificar/responsabilidad/liderazgo_y_compromiso", component: LiderazgoYCompromisoComponent },
      { path: "planificar/responsabilidad/objetivos_y_metas", component: ObjetivosMetasComponent },
      { path: "planificar/evaluacion", component: EvaluacionComponent },
      { path: "planificar/diagnostico", component: DiagnosticoComponent },
      { path: "planificar/diagnostico/gestion_archivos", component: ZGestionArchivosComponent },
      { path: "planificar/diagnostico/sociodemografia", component: SociodemografiaComponent },
      { path: "planificar/diagnostico/movilidad", component: MovilidadComponent },
      { path: "planificar/diagnostico/factor_riesgo", component: FactorRiesgoComponent },
      { path: "planificar/diagnostico/accidentalidad", component: AccidentalidadComponent },
      { path: "planificar/diagnostico/encuestas", component: EncuestasComponent },
      { path: "planificar/diagnostico/evidencias", component: EvidenciasComponent },
      { path: "planificar/programas", component: ProgramasComponent },
      { path: "planificar/matriz_legal", component: MatrizLegalComponent },
      //hacer
      { path: "hacer", component: HacerComponent },
      //verificar
      { path: "verificar", component: VerificarComponent },
      //actuar
      { path: "actuar", component: ActuarComponent },
      { path: "dashboardplanificar", component: DashboardplanificarComponent },
      { path: "settings", component: SettingsComponent },
      { path: "desarrollo", component: DesarrolloComponent },
      { path: "maps", component: MapsComponent },

    ],
  },

  // Rutas protegidas (se requieren permisos con authGuard)
  // { path: "starting", component: InicioComponent, canActivate: [authGuard] },
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
  { path: '', redirectTo: '/login1', pathMatch: 'full' },
  { path: '**', redirectTo: '/login1' }
];
