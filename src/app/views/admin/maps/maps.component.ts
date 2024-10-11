import { Component, OnInit } from "@angular/core";
import { MapExampleComponent } from "../../../components/maps/map-example/map-example.component";

@Component({
  selector: "app-maps",
  standalone: true,
  imports: [MapExampleComponent],
  templateUrl: "./maps.component.html",
})
export class MapsComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {}
}
