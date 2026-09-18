import { Component, Input, OnInit, inject } from "@angular/core";
import { SidebarComponent } from "../../components/sidebar/sidebar.component";
import { AdminNavbarComponent } from "../../components/navbars/admin-navbar/admin-navbar.component";
import { HeaderStatsComponent } from "../../components/headers/header-stats/header-stats.component";
import { FooterAdminComponent } from "../../components/footers/footer-admin/footer-admin.component";
import { RouterOutlet } from "@angular/router";
import { RolUsuarioService } from "../../services/shared/rol-usuario.service";
import { EmpresaService } from "../../services/shared/empresa.service";

@Component({
  selector: "app-admin",
  standalone: true,
  imports: [SidebarComponent,AdminNavbarComponent,HeaderStatsComponent,FooterAdminComponent,RouterOutlet],
  templateUrl: "./admin.component.html",
})
export class AdminComponent implements OnInit {

  @Input() muestramestats: boolean = false;

  private _rol = inject(RolUsuarioService);
  private _empresa = inject(EmpresaService);

  ngOnInit(): void {
    // Se carga una vez para toda la zona de administracion: el rol decide que
    // acciones se muestran, y pedirlo en cada modulo seria repetirlo.
    this._rol.cargar();
    // La razon social alimenta las plantillas de documentos: se carga una vez
    // aqui en lugar de que cada modulo la pida por su cuenta.
    this._empresa.cargar();
  }
}
