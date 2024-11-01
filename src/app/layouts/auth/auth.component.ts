import { Component, OnInit } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { AuthNavbarComponent } from "../../components/navbars/auth-navbar/auth-navbar.component";
import { FooterSmallComponent } from "../../components/footers/footer-small/footer-small.component";
import { IndexNavbarComponent } from "../../components/navbars/index-navbar/index-navbar.component";

@Component({
  selector: "app-auth",
  standalone: true,
  imports: [RouterOutlet, AuthNavbarComponent, FooterSmallComponent, IndexNavbarComponent],
  templateUrl: "./auth.component.html",
})
export class AuthComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {}
}
