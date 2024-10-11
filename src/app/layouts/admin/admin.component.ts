import { Component, Input, OnInit } from "@angular/core";
import { SidebarComponent } from "../../components/sidebar/sidebar.component";
import { AdminNavbarComponent } from "../../components/navbars/admin-navbar/admin-navbar.component";
import { HeaderStatsComponent } from "../../components/headers/header-stats/header-stats.component";
import { FooterAdminComponent } from "../../components/footers/footer-admin/footer-admin.component";
import { RouterOutlet } from "@angular/router";

@Component({
  selector: "app-admin",
  standalone: true,
  imports: [SidebarComponent,AdminNavbarComponent,HeaderStatsComponent,FooterAdminComponent,RouterOutlet],
  templateUrl: "./admin.component.html",
})
export class AdminComponent implements OnInit {

  @Input() muestramestats: boolean = false;

  constructor() {}

  ngOnInit(): void {}
}
