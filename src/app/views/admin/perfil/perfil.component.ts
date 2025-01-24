import { Component, OnInit } from '@angular/core';
import { CardSettingsComponent } from "../../../components/cards/card-settings/card-settings.component";
import { CardProfileComponent } from "../../../components/cards/card-profile/card-profile.component";
import { CommonModule } from '@angular/common';
import { RestorePasswordComponent } from "../../../components/otros/restore-password/restore-password.component";
import { SubirImagenComponent } from "../../../components/otros/subir-imagen/subir-imagen.component";


@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, CardSettingsComponent, CardProfileComponent, RestorePasswordComponent, SubirImagenComponent],
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.css'
})
export class PerfilComponent implements OnInit {

  constructor() { }
   
  ngOnInit(): void {

  }


}
