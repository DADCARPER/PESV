import { Component } from '@angular/core';
import { CardSettingsComponent } from "../../../../components/cards/card-settings/card-settings.component";
import { RestorePasswordComponent } from "../../../../components/otros/restore-password/restore-password.component";
import { ComboselectComponent } from "../../../../components/controlesFormulario/comboselect/comboselect.component";
import { CommonModule } from '@angular/common';
import { CardsBotonComponent } from "../../../../components/cards/cards-boton/cards-boton.component";

interface RiskSection {
  identification: {
    location: string;
    tasks: string;
    exposed: string;
    actor: string;
    position: string;
    component: string;
  };
  hazard: {
    description: string;
    source: string;
    effects: string;
  };
  controls: {
    source: string;
    medium: string;
    worker: string;
  };
  evaluation: {
    deficiencyLevel: number;
    exposureLevel: number;
    probabilityLevel: number;
    consequenceLevel: number;
    riskLevel: string;
  };
  intervention: {
    elimination: string;
    substitution: string;
    engineeringControls: string;
    administrativeControls: string;
    warnings: string;
  };
}

@Component({
  selector: 'app-evaluacion',
  standalone: true,
  imports: [CommonModule, ComboselectComponent, CardsBotonComponent],
  templateUrl: './evaluacion.component.html',
  styleUrl: './evaluacion.component.css'
})
export class EvaluacionComponent {

  openTab = 0;

  toggleTabs(ids:number, id:string){}
}
