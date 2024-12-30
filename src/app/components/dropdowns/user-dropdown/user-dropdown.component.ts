import { Component, AfterViewInit, ViewChild, ElementRef, inject } from "@angular/core";
import { CommonModule } from '@angular/common';
import { createPopper } from "@popperjs/core";
import { LoginService } from "../../../services/login.service";

@Component({
  selector: "app-user-dropdown",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./user-dropdown.component.html",
})
export class UserDropdownComponent implements AfterViewInit {

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

  salir(){
    this._auth.logout();
  }
}
