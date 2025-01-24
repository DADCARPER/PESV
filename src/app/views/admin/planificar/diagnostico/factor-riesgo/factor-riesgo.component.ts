import { Component } from '@angular/core';
import { ColumnsBarHorizontalComponent } from "../../../../../components/apexChart/columns-bar-horizontal/columns-bar-horizontal.component";
import { CommonModule } from '@angular/common';

interface CauseData {
  causa: string;
  porcentaje: number;
}

@Component({
  selector: 'app-factor-riesgo',
  standalone: true,
  imports: [CommonModule, ColumnsBarHorizontalComponent],
  templateUrl: './factor-riesgo.component.html',
  styleUrl: './factor-riesgo.component.css'
})
export class FactorRiesgoComponent {

  causasAccidentes1: CauseData[] = [
    { causa: 'Uso de alcohol y/o drogas', porcentaje: 20.81 },
    { causa: 'Sueño', porcentaje: 50.11 },
    { causa: 'No respetar señales de transito', porcentaje: 50.92 },
    { causa: 'Maniobras peligrosas', porcentaje: 80.01 },
    { causa: 'Intolerancia', porcentaje: 89.31 },
    { causa: 'Exceso de velocidad', porcentaje: 20.32 },
    { causa: 'Distracción', porcentaje: 5.52 }
  ];

  causasAccidentes2: CauseData[] = [
    { causa: 'Mal estado de la carpeta de rodadura (Pavimento)', porcentaje: 70.10 },
    { causa: 'Ausencia de señales de tránsito verticales', porcentaje: 9.28 },
    { causa: 'Pérdida de visibilidad de la vía', porcentaje: 7.22 },
    { causa: 'Carriles, bermas y andenes angostos', porcentaje: 4.12 },
    { causa: 'Falta de demarcación horizontal (Marcas en la vía)', porcentaje: 3.09 },
    { causa: 'Falta de elementos de contención', porcentaje: 3.09 },
    { causa: 'Falta de otros elementos como: Alcantarillas, postes de luz, etc.', porcentaje: 3.09 }
  ];

  causasAccidentes3: CauseData[] = [
    { causa: 'Falla mecánica (Frenos, dirección, fugas, mal estado de llantas, entre otros)', porcentaje: 47.31 },
    { causa: 'Falta de mantenimiento del vehículo', porcentaje: 34.41 },
    { causa: 'No realizar inspecciones preoperacionales n\ (Antes de arrancar el vehículo para un desplazamiento)', porcentaje: 18.28 }
  ];

  causasAccidentes4: CauseData[] = [
    { causa: 'Condiciones climáticas (Lluvia, neblina, fuertes vientos, entre otras)', porcentaje: 52.58 },
    { causa: 'Otros actores viales (Comportamientos, conductas y hábitos)', porcentaje: 25.77 },
    { causa: 'Intensidad del tráfico', porcentaje: 15.46 },
    { causa: 'Riesgo público (Robos, atracos)', porcentaje: 2.06 },
    { causa: 'Avalanchas, derrumbes', porcentaje: 2.06 },
    { causa: 'Animales en la vía', porcentaje: 2.06 }
];

}
