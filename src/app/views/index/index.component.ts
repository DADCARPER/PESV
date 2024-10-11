import { Component, OnInit } from "@angular/core";
import { IndexNavbarComponent } from "../../components/navbars/index-navbar/index-navbar.component";
import { RouterLink } from "@angular/router";
import { FooterComponent } from "../../components/footers/footer/footer.component";

@Component({
  selector: "app-index",
  standalone: true,
  imports: [IndexNavbarComponent,RouterLink,FooterComponent],
  templateUrl: "./index.component.html",
})
export class IndexComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {}
}
