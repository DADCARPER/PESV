import { Routes } from '@angular/router';
//import { LoginComponent } from './pages/login/login.component';
import { authGuard } from './guards/auth.guard';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ActuarComponent } from './pages/actuar/actuar.component';
import { HacerComponent } from './pages/hacer/hacer.component';
import { PlanearComponent } from './pages/planear/planear.component';
import { VerificarComponent } from './pages/verificar/verificar.component';
//import { DashboardComponent } from './views/admin/dashboard/dashboard.component';
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


// Rutas principales
export const routes: Routes = [
  // Rutas del layout de autenticación
  {
    path: 'auth',
    component: AuthComponent,
    children: [
      { path: 'login', component: LoginComponent },
      { path: 'register', component: RegisterComponent },
      { path: "", redirectTo: "login", pathMatch: "full" },
    ],
  },

  // Rutas del layout de admin
  {
    path: "admin",
    component: AdminComponent,
    children: [
      
      { path: "dashboard", component: DashboardComponent },

      { path: "planificar", component: PlanificarComponent },
      { path: "planificar/responsabilidad", component: ResponsabilidadComponent },
      { path: "planificar/responsabilidad/liderdelpesv", component: LiderDelPesvComponent },
      { path: "planificar/evaluacion", component: EvaluacionComponent },
      { path: "planificar/diagnostico", component: DiagnosticoComponent },
      { path: "planificar/diagnostico/sociodemografia", component: SociodemografiaComponent },
      { path: "planificar/diagnostico/movilidad", component: MovilidadComponent },
      { path: "planificar/diagnostico/factor_riesgo", component: FactorRiesgoComponent },
      { path: "planificar/diagnostico/accidentalidad", component: AccidentalidadComponent },
      { path: "planificar/diagnostico/encuestas", component: EncuestasComponent },
      { path: "planificar/diagnostico/evidencias", component: EvidenciasComponent },
      { path: "planificar/programas", component: ProgramasComponent },
      { path: "planificar/matriz_legal", component: MatrizLegalComponent },

      { path: "dashboardplanificar", component: DashboardplanificarComponent },
      { path: "settings", component: SettingsComponent },
      { path: "tables", component: TablesComponent },
      { path: "maps", component: MapsComponent },
      { path: "", redirectTo: "dashboard", pathMatch: "full" },
    ],
  },

  // Rutas protegidas (se requieren permisos con authGuard)
  { path: "starting", component: InicioComponent, canActivate: [authGuard] },
  { path: 'dashboard1', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'login1', component: LoginComponent },
  { path: 'actuar', component: ActuarComponent, canActivate: [authGuard] },
  { path: 'hacer', component: HacerComponent, canActivate: [authGuard] },
  { path: 'planear', component: PlanearComponent, canActivate: [authGuard] },
  { path: 'verificar', component: VerificarComponent, canActivate: [authGuard] },

  // Rutas sin layout
  { path: 'index', component: IndexComponent },
  { path: 'landing', component: LandingComponent },
  { path: 'profile', component: ProfileComponent },

  // Redirección por defecto
  //{ path: '', redirectTo: '/auth/login', pathMatch: 'full' },
  //{ path: '**', redirectTo: '/auth/login' }
];
