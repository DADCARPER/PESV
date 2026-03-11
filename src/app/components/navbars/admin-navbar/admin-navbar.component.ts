import { Component, Input, OnInit, CUSTOM_ELEMENTS_SCHEMA, signal, inject, viewChild } from "@angular/core";
import { CommonModule } from "@angular/common";
import { UserDropdownComponent } from "../../dropdowns/user-dropdown/user-dropdown.component";
import { AuthenticacionService } from "../../../services/shared/authenticacion.service";
import { FirestoreService } from "../../../services/shared/firestore.service";
import { Router, RouterLink } from "@angular/router";
import { ModalComponent } from "./modal/modal.component";
import { Models } from "../../../interfaces/models";


@Component({
  selector: "app-admin-navbar",
  standalone: true,
  imports: [CommonModule, UserDropdownComponent, ModalComponent, RouterLink],
  schemas:[CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: "./admin-navbar.component.html",
})
export class AdminNavbarComponent implements OnInit {

  modalPeriodoCambia = viewChild.required<ModalComponent>('modal');

  private _auth = inject(AuthenticacionService);
  private _firestore = inject(FirestoreService);
  private _router = inject(Router);
  @Input() titulopagina: string = "PESV Interactivo";

  nivelAcceso = signal<string>('');
  nombreEmpresa: string = '---';
  email: string = '---';

  constructor() {
    this.selectedPeriod.set(this._auth.periodo());
  }

  async ngOnInit(): Promise<void> {
    const user = this._auth.getCurrentUser();
    if (user) {
      this.nombreEmpresa = user.photoURL ?? '---';
      this.email = user.email ?? '---';
      const doc = await this._firestore.getDocument<Models.Users.Usuario>('users/' + user.uid);
      if (doc.exists()) {
        this.nivelAcceso.set(doc.data().nivelAcceso ?? '');
      }
    }
  }

  nivelLabel(): string {
    switch (this.nivelAcceso()) {
      case 'basico':   return 'Nivel Básico';
      case 'medio':    return 'Nivel Estándar';
      case 'avanzado': return 'Nivel Avanzado';
      default:         return '';
    }
  }

  nivelClasses(): string {
    switch (this.nivelAcceso()) {
      case 'basico':   return 'bg-blue-100 text-blue-700';
      case 'medio':    return 'bg-amber-100 text-amber-700';
      case 'avanzado': return 'bg-green-100 text-green-700';
      default:         return 'bg-gray-100 text-gray-500';
    }
  }

  selectedPeriod = signal(new Date().getFullYear());
  isOpen = signal(false);
  periods = [2024, 2025, 2026, 2027, 2028];

  toggleDropdown() {
    this.isOpen.set(!this.isOpen());
  }

  selectPeriod(period: number) {
    this.modalPeriodoCambia().abrirModal(period);
  }

  recibeDato(valor: any) {
    if(valor){
      this.selectedPeriod.set(valor);
      this.isOpen.set(false);
      this._auth.periodoActual(valor);
      this._router.navigate(['admin/dashboard']);
    }else{
      this.isOpen.set(false);
    }
  }

}
