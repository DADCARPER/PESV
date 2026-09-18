import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardSettingsComponent } from "../../../components/cards/card-settings/card-settings.component";
import { SubirImagenComponent } from "../../../components/otros/subir-imagen/subir-imagen.component";

/**
 * Datos personales del usuario. Los de la empresa, compartidos por todos sus
 * usuarios, viven en su propia pantalla.
 */
@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, CardSettingsComponent, SubirImagenComponent],
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.css'
})
export class PerfilComponent {
}
