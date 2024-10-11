import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";

@Component({
  selector: "app-register",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./register.component.html",
})
export class RegisterComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {}
}
