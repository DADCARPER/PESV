import { Component } from '@angular/core';
import { LoadingComponent } from "../../../../../components/loading/loading/loading.component";
import { CommonModule } from '@angular/common';
import { SimplePieComponent } from "../../../../../components/apexChart/simple-pie/simple-pie.component";
import { LineColumnComponent } from "../../../../../components/apexChart/line-column/line-column.component";
import { DonutComponent } from "../../../../../components/apexChart/donut/donut.component";
import { PieMonochromeComponent } from "../../../../../components/apexChart/pie-monochrome/pie-monochrome.component";
import { ColumnsStrackedComponent } from "../../../../../components/apexChart/columns-stracked/columns-stracked.component";
import { ColumnsStrackedIconosComponent } from "../../../../../components/apexChart/columns-stracked-iconos/columns-stracked-iconos.component";
import { CardProfidComponent } from "../../../../../components/cards/card-profid/card-profid.component";
import { ColumnsStrackedNumericoComponent } from "../../../../../components/apexChart/columns-stracked-numerico/columns-stracked-numerico.component";

@Component({
  selector: 'app-sociodemografia',
  standalone: true,
  imports: [CommonModule, LoadingComponent, SimplePieComponent, LineColumnComponent, DonutComponent, PieMonochromeComponent, ColumnsStrackedComponent, ColumnsStrackedIconosComponent, CardProfidComponent, ColumnsStrackedNumericoComponent],
  templateUrl: './sociodemografia.component.html',
  styleUrl: './sociodemografia.component.css'
})
export class SociodemografiaComponent {

  userId: string | null = null;
  isLoading = false; //Al terminar el modulo de ir en true

  columnasProductos = [
    { header: "Edad / Genero", field: "rango" },
    { header: "Femenino", field: "feme" },
    { header: "Masculino", field: "masc" },
    { header: "Total", field: "total" },
  ]

  datosProductos = [
    { rango: "Más de 51", feme: 120, masc: 50, total: "12.24%" },
    { rango: "Entre 41-50", feme: 95, masc: 120, total: "23.47%" },
    { rango: "Entre 26-40", feme: 87, masc: 35, total: "52.04%" },
    { rango: "Entre 18-25", feme: 65, masc: 80, total: "12.24%" },
  ]

  columnas1 = [
    { header: "Genero", field: "femenino" },
    { header: "Frecuencia", field: "masculino" },
  ]

  datos1 = [
    { femenino: "Femenino", masculino: 12 },
    { femenino: "Masculino", masculino: 17 },
  ]
  
  columnas2 = [
    { header: "Rango", field: "rango" },
    { header: "Frecuencia", field: "frecuencia" },
  ]

  datos2 = [
    { rango: "51 en adelante", frecuencia: 12 },
    { rango: "Entre 26-40", frecuencia: 17 },
    { rango: "Entre 41-50", frecuencia: 23 },
    { rango: "Entre 18-25", frecuencia: 15 },
  ]

  columnas3 = [
    { header: "Escolaridad", field: "escolaridad" },
    { header: "Frecuencia", field: "frecuencia" },
  ]

  datos3 = [
    { escolaridad: "Bachiller", frecuencia: 10.42 },
    { escolaridad: "Técnico", frecuencia: 11.67 },
    { escolaridad: "Tecnólogo", frecuencia: 7.08 },
    { escolaridad: "Profesional", frecuencia: 7.05 },
    { escolaridad: "Especialista", frecuencia: 4.17 },
  ]

  columnas4 = [
    { header: "Estrato", field: "estrato" },
    { header: "Frecuencia", field: "frecuencia" },
  ]

  datos4 = [
    { estrato: "Estrato 1", frecuencia: 8.16 },
    { estrato: "Estrato 2", frecuencia: 44.90 },
    { estrato: "Estrato 3", frecuencia: 30.61 },
    { estrato: "Estrato 4", frecuencia: 9.18 },
    { estrato: "Estrato 5", frecuencia: 2.40 },
    { estrato: "Estrato 6", frecuencia: 4.17 },
  ]


}
