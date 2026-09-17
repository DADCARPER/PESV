import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CardSettingsComponent } from "../../../components/cards/card-settings/card-settings.component";
import { SubirImagenComponent } from "../../../components/otros/subir-imagen/subir-imagen.component";

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, CardSettingsComponent, SubirImagenComponent],
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.css'
})
export class PerfilComponent implements OnInit {

  private _ruta = inject(ActivatedRoute);
  private _router = inject(Router);

  /**
   * Se muestra al llegar desde el cuestionario inicial (?bienvenida=1), para
   * explicar por qué conviene completar el perfil antes de empezar.
   */
  mostrarBienvenida = false;

  ngOnInit(): void {
    this.mostrarBienvenida = this._ruta.snapshot.queryParamMap.get('bienvenida') === '1';
  }

  /**
   * Cierra el aviso y limpia el parámetro de la URL, para que no reaparezca
   * si el usuario recarga o vuelve atrás.
   */
  cerrarBienvenida() {
    this.mostrarBienvenida = false;
    this._router.navigate([], {
      relativeTo: this._ruta,
      queryParams: {},
      replaceUrl: true,
    });
  }
}
