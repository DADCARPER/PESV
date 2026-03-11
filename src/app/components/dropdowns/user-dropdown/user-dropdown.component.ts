import { Component, Input, inject } from "@angular/core";
import { CommonModule } from '@angular/common';
import { AuthenticacionService } from "../../../services/shared/authenticacion.service";
import { RouterLink } from "@angular/router";

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
  dropdownPopoverShow = false;

  getInitials(): string {
    return (this.nameEmpresa ?? '').trim().slice(0, 2).toUpperCase();
  }

  toggleDropdown(event: Event) {
    event.preventDefault();
    this.dropdownPopoverShow = !this.dropdownPopoverShow;
  }

  salir(event: Event) {
    this._auth.logout();
    this.toggleDropdown(event);
  }
}
