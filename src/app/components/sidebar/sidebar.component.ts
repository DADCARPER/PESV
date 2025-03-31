import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA  } from "@angular/core";
import { RouterLink, RouterLinkActive } from "@angular/router";
import { NotificationDropdownComponent } from "../dropdowns/notification-dropdown/notification-dropdown.component";
import { CommonModule } from "@angular/common";
import { UserDropdownComponent } from "../dropdowns/user-dropdown/user-dropdown.component";
import { Firestore } from '@angular/fire/firestore';
import { FirestoreService } from "../../services/firestore.service";
import { LoginService } from "../../services/login.service";
import { SignalsService } from "../../services/signals.service";
import { UserProfile } from "../../interfaces/perfil.interface";

@Component({
  selector: "app-sidebar",
  standalone: true,
  imports: [RouterLink,NotificationDropdownComponent,CommonModule,UserDropdownComponent,RouterLinkActive],
  templateUrl: "./sidebar.component.html",
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  collapseShow = "hidden";
  submenuOpen = false;
  submenuLiderOpen = false;
  dashboardInicio = false;
  submenuPlanificar = false;
  submenuDiagnostico = false;
  submenuHacer = false;
  submenuVerificar = false;
  submenuActuar = false;

  datosUser: UserProfile={};

  //signals para mostrar imagenes IMPORTANTE se crea un servicio para manejar las señales


  constructor(
    private _firestore: FirestoreService,
    private _login: LoginService,
    public _logoimagen: SignalsService
  ) {

    // Cargar el logo inicial
    const userId = this._login.userIdSignal();
    console.debug("aaaaaaaaaaaaaaaaaaaaaaaaaaaa"+userId);
    if (userId) {
      this._firestore.getDocument(`users/${userId}`).then(userData => {
        if (userData && userData["logoEmpresaURL"]) {
          this.datosUser = userData;
          this._logoimagen.setLogoUrl(userData["logoEmpresaURL"]);
          console.log("Logo cargado", userData["logoEmpresaURL"]);
          console.log("ver todos los datos", this.datosUser.nombreEmpresa);
        }
      });
    }

  }

  ngOnInit() {}

  collapseDashboard(){
    this.submenuPlanificar = false;
    this.submenuHacer = false;
    this.submenuVerificar = false;
    this.submenuActuar = false;
  }

  collapsePlanificar(){
    this.submenuPlanificar = !this.submenuPlanificar;
    this.submenuHacer = false;
    this.submenuVerificar = false;
    this.submenuActuar = false;
  }
  collapseDiagnostico(){
    this.submenuDiagnostico = !this.submenuDiagnostico;
  }
  collapseHacer(){
    this.submenuHacer = !this.submenuHacer;
    this.submenuPlanificar = false;
    this.submenuVerificar = false;
    this.submenuActuar = false;
  }
  collapseVerificar(){
    this.submenuVerificar = !this.submenuVerificar;
    this.submenuHacer = false;
    this.submenuPlanificar = false;
    this.submenuActuar = false;
  }
  collapseActuar(){
    this.submenuActuar = !this.submenuActuar;
    this.submenuHacer = false;
    this.submenuVerificar = false;
    this.submenuPlanificar = false;
  }

  toggleCollapseShow(classes:any) {
    this.collapseShow = classes;
  }

  toggleSubmenu() {
    this.submenuOpen = !this.submenuOpen;
  }

  toggleSubSubmenu() {
    this.submenuLiderOpen = !this.submenuLiderOpen;
  }


}
