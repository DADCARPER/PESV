import { Component, OnInit } from "@angular/core";
import { CardTableComponent } from "../../../components/cards/card-table/card-table.component";

@Component({
  selector: "app-tables",
  standalone: true,
  imports: [CardTableComponent],
  templateUrl: "./tables.component.html",
})
export class TablesComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {}
}
