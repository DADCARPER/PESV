import { Component, Input, inject } from "@angular/core";
import { CommonModule } from '@angular/common';
import { AuthenticacionService } from "../../../services/shared/authenticacion.service";
import { Router, RouterLink } from "@angular/router";
import { RUTA_LOGIN } from "../../../guards/auth.guard";

@Component({
  selector: "app-user-dropdown",
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: "./user-dropdown.component.html",
  styleUrl: './user-dropdown.component.css',
})
export class UserDropdownComponent {

  @Input() size: string = 'w-9 h-9';
  @Input() nameEmpresa: string = '---';
  @Input() email: string = '---';

  private _auth = inject(AuthenticacionService);
  private _router = inject(Router);
  dropdownPopoverShow = false;

  getInitials(): string {
    return (this.nameEmpresa ?? '').trim().slice(0, 2).toUpperCase();
  }

  toggleDropdown(event: Event) {
    event.preventDefault();
    this.dropdownPopoverShow = !this.dropdownPopoverShow;
  }

  async salir(event: Event) {
    this.toggleDropdown(event);
    try {
      await this._auth.logout();
    } catch (error: unknown) {
      console.error('[UserDropdown] logout:', error);
    }
    // Sin esto la vista de admin seguía en pantalla con la sesión ya cerrada:
    // el guard solo se evalúa al navegar.
    this._router.navigate([RUTA_LOGIN]);
  }
}
