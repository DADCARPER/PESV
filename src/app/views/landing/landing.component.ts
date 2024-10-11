import { Component, OnInit } from "@angular/core";
import { AuthNavbarComponent } from "../../components/navbars/auth-navbar/auth-navbar.component";
import { RouterLink } from "@angular/router";
import { FooterComponent } from "../../components/footers/footer/footer.component";

@Component({
  selector: "app-landing",
  standalone: true,
  imports: [AuthNavbarComponent,RouterLink,FooterComponent],
  templateUrl: "./landing.component.html",
})
export class LandingComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {}
}
