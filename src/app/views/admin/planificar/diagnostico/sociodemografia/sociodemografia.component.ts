import { Component } from '@angular/core';
import { LoadingComponent } from "../../../../../components/loading/loading/loading.component";
import { CommonModule } from '@angular/common';
import { SimplePieComponent } from "../../../../../components/apexChart/simple-pie/simple-pie.component";
import { LineColumnComponent } from "../../../../../components/apexChart/line-column/line-column.component";
import { DonutComponent } from "../../../../../components/apexChart/donut/donut.component";
import { PieMonochromeComponent } from "../../../../../components/apexChart/pie-monochrome/pie-monochrome.component";
import { ColumnsStrackedComponent } from "../../../../../components/apexChart/columns-stracked/columns-stracked.component";

@Component({
  selector: 'app-sociodemografia',
  standalone: true,
  imports: [CommonModule, LoadingComponent, SimplePieComponent, LineColumnComponent, DonutComponent, PieMonochromeComponent, ColumnsStrackedComponent],
  templateUrl: './sociodemografia.component.html',
  styleUrl: './sociodemografia.component.css'
})
export class SociodemografiaComponent {

  userId: string | null = null;
  isLoading = false; //Al terminar el modulo de ir en true

}
