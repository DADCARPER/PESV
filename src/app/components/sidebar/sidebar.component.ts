import { Component, OnInit } from "@angular/core";
import { RouterLink, RouterLinkActive } from "@angular/router";
import { NotificationDropdownComponent } from "../dropdowns/notification-dropdown/notification-dropdown.component";
import { CommonModule } from "@angular/common";
import { UserDropdownComponent } from "../dropdowns/user-dropdown/user-dropdown.component";
import { Firestore } from '@angular/fire/firestore';
import { FirestoreService } from "../../services/firestore.service";
import { LoginService } from "../../services/login.service";
import { SignalsService } from "../../services/signals.service";

@Component({
  selector: "app-sidebar",
  standalone: true,
  imports: [RouterLink,NotificationDropdownComponent,CommonModule,UserDropdownComponent,RouterLinkActive],
  templateUrl: "./sidebar.component.html",
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  collapseShow = "hidden";
  submenuOpen = false;
  submenuLiderOpen = false;
  dashboardInicio = false;
  submenuPlanificar = false;
  submenuDiagnostico = false;

  imgUrl: string = "";

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
          this._logoimagen.setLogoUrl(userData["logoEmpresaURL"]);
        }
      });
    }

  }

  ngOnInit() {}


  collapsePlanificar(){
    this.submenuPlanificar = !this.submenuPlanificar;
  }
  collapseDiagnostico(){
    this.submenuDiagnostico = !this.submenuDiagnostico;
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
