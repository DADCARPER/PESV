import { Component, OnInit } from "@angular/core";
import { RouterLink, RouterLinkActive } from "@angular/router";
import { NotificationDropdownComponent } from "../dropdowns/notification-dropdown/notification-dropdown.component";
import { CommonModule } from "@angular/common";
import { UserDropdownComponent } from "../dropdowns/user-dropdown/user-dropdown.component";

@Component({
  selector: "app-sidebar",
  standalone: true,
  imports: [RouterLink,NotificationDropdownComponent,CommonModule,UserDropdownComponent,RouterLinkActive],
  templateUrl: "./sidebar.component.html",
})
export class SidebarComponent implements OnInit {
  collapseShow = "hidden";
  submenuOpen = false;
  submenuLiderOpen = false;

  dashboardInicio = false;

  submenuPlanificar = false;

  submenuDiagnostico = false;

  constructor() {}

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
