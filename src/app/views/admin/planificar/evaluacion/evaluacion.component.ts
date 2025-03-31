import { Component } from '@angular/core';
import { CardSettingsComponent } from "../../../../components/cards/card-settings/card-settings.component";
import { RestorePasswordComponent } from "../../../../components/otros/restore-password/restore-password.component";
import { ComboselectComponent } from "../../../../components/controlesFormulario/comboselect/comboselect.component";
import { CommonModule } from '@angular/common';
import { CardsBotonComponent } from "../../../../components/cards/cards-boton/cards-boton.component";
import { RouterLink } from '@angular/router';
import AOS from 'aos'; // Importa AOS


@Component({
  selector: 'app-evaluacion',
  standalone: true,
  imports: [CommonModule, RouterLink, CardsBotonComponent],
  templateUrl: './evaluacion.component.html',
  styleUrl: './evaluacion.component.css'
})
export class EvaluacionComponent {

  openTab = 0;

  constructor(){
    AOS.init();
  }
  toggleTabs(ids:number, id:string){}
}
