import { Component, AfterViewInit, ViewChild, ElementRef, inject, Input } from "@angular/core";
import { CommonModule } from '@angular/common';
import { createPopper } from "@popperjs/core";
import { LoginService } from "../../../services/login.service";
import { RouterLink } from "@angular/router";

@Component({
  selector: "app-user-dropdown",
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: "./user-dropdown.component.html",
  styleUrl: './user-dropdown.component.css',
})
export class UserDropdownComponent implements AfterViewInit {

  @Input() size: string = 'w-24 h-24'; // Valor por defecto
  @Input() imageUrl: string = 'assets/img/team-1-800x800.jpg'; // Valor por defecto
  @Input() nameEmpresa: string = '- - -'; // Valor por defecto
  @Input() email: string = ' - - - '; // Valor por defecto

  private _auth = inject(LoginService);
  dropdownPopoverShow = false;
  @ViewChild("btnDropdownRef", { static: false }) btnDropdownRef!: ElementRef;
  @ViewChild("popoverDropdownRef", { static: false }) popoverDropdownRef!: ElementRef;
  
  ngAfterViewInit() {
    createPopper(
      this.btnDropdownRef.nativeElement,
      this.popoverDropdownRef.nativeElement,
      {
        placement: "bottom-start",
      }
    );
  }
  
  toggleDropdown(event: Event) {
    event.preventDefault();
    this.dropdownPopoverShow = !this.dropdownPopoverShow;
  }

  salir(event: Event){
    this._auth.logout();
    this.toggleDropdown(event);
  }
}
