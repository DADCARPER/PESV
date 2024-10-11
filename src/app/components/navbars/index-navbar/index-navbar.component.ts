import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { RouterLink } from "@angular/router";
import { IndexDropdownComponent } from "../../dropdowns/index-dropdown/index-dropdown.component";

@Component({
  selector: "app-index-navbar",
  standalone: true,
  imports: [RouterLink, CommonModule,IndexDropdownComponent],
  templateUrl: "./index-navbar.component.html",
})
export class IndexNavbarComponent implements OnInit {
  navbarOpen = false;

  constructor() {}

  ngOnInit(): void {}

  setNavbarOpen() {
    this.navbarOpen = !this.navbarOpen;
  }
}
