import { Component, Input, OnInit } from "@angular/core";
import { UserDropdownComponent } from "../../dropdowns/user-dropdown/user-dropdown.component";

@Component({
  selector: "app-admin-navbar",
  standalone: true,
  imports: [UserDropdownComponent],
  templateUrl: "./admin-navbar.component.html",
})
export class AdminNavbarComponent implements OnInit {

  @Input() titulopagina: string = "NIT 900456798-7 - ES&VA SOLUCIONES INTEGRALES S.A.S";

  constructor() {}

  ngOnInit(): void {}
}
