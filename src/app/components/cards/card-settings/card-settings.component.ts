import { Component, OnInit, inject, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink } from "@angular/router";

import { UserProfile } from '../../../interfaces/perfil.interface';
import { PerfilService } from '../../../services/shared/perfil.service';
import { AlertaService } from '../../../services/shared/alerta.service';
import { AlertaInformativoComponent } from "../../alertas/alerta-informativo/alerta-informativo.component";

@Component({
  selector: "app-card-settings",
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, AlertaInformativoComponent],
  templateUrl: "./card-settings.component.html",
  // <iconify-icon> es un web component, no un componente Angular.
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class CardSettingsComponent implements OnInit {

  private fb = inject(FormBuilder);
  private _perfil = inject(PerfilService);
  public _alertaService = inject(AlertaService);

  formPerfil!: FormGroup;

  cargando = true;
  guardando = false;

  ngOnInit(): void {
    this.iniciarformulariolimpio();
    this.cargarPerfil();
  }

  iniciarformulariolimpio() {
    this.formPerfil = this.fb.group({
      nombreCompleto: ['', Validators.required],
      // El correo de acceso no se edita aquí: cambiarlo exige reautenticación.
      email: [{ value: '', disabled: true }],
      telefono: ['', Validators.required],
      cargoEmpresa: ['']
    });
  }

  async onSubmit() {
    if (this.formPerfil.invalid) {
      this.formPerfil.markAllAsTouched();
      this._alertaService.showWarning('Revisa los campos marcados antes de guardar.');
      return;
    }

    this.guardando = true;
    try {
      const datos: UserProfile = {
        ...this.formPerfil.value,
        updatedAt: new Date().toISOString(),
      };

      await this._perfil.updatePerfil(datos);
      this._alertaService.showSuccess('Perfil actualizado correctamente.');
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'No se pudo guardar el perfil';
      console.error('[Perfil] onSubmit:', error);
      this._alertaService.showError(msg);
    } finally {
      this.guardando = false;
    }
  }

  private async cargarPerfil() {
    this.cargando = true;
    try {
      const perfil = await this._perfil.getPerfilEdit();
      this.formPerfil.patchValue(perfil);
    } catch (error: unknown) {
      console.error('[Perfil] cargarPerfil:', error);
      this._alertaService.showError('No se pudieron cargar tus datos. Revisa tu conexión.');
    } finally {
      this.cargando = false;
    }
  }

  /** ¿Mostrar el campo en rojo? Solo tras tocarlo, para no asustar de entrada. */
  invalido(campo: string): boolean {
    const c = this.formPerfil.get(campo);
    return !!c && c.invalid && c.touched;
  }
}
