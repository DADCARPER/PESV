import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { PagesDropdownComponent } from "../../dropdowns/pages-dropdown/pages-dropdown.component";
import { RouterLink } from "@angular/router";

@Component({
  selector: "app-auth-navbar",
  standalone: true,
  imports: [CommonModule,PagesDropdownComponent,RouterLink],
  templateUrl: "./auth-navbar.component.html",
})
export class AuthNavbarComponent implements OnInit {
  navbarOpen = false;

  constructor() {}

  ngOnInit(): void {}

  setNavbarOpen() {
    this.navbarOpen = !this.navbarOpen;
  }
}
