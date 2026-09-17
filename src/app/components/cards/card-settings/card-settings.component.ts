import { Component, OnInit, inject, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ReactiveFormsModule, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { RouterLink } from "@angular/router";

import { options, ciudades } from '../../../data/categorias-data';
import { UserProfile } from '../../../interfaces/perfil.interface';
import { AuthenticacionService } from '../../../services/shared/authenticacion.service';
import { PerfilService } from '../../../services/shared/perfil.service';
import { AlertaService } from '../../../services/shared/alerta.service';
import { ComboselectComponent } from "../../controlesFormulario/comboselect/comboselect.component";
import { AlertaInformativoComponent } from "../../alertas/alerta-informativo/alerta-informativo.component";

@Component({
  selector: "app-card-settings",
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, ComboselectComponent, AlertaInformativoComponent],
  templateUrl: "./card-settings.component.html",
  // <iconify-icon> es un web component, no un componente Angular.
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class CardSettingsComponent implements OnInit {

  private fb = inject(FormBuilder);
  private _perfil = inject(PerfilService);
  private _auth = inject(AuthenticacionService);
  public _alertaService = inject(AlertaService);

  /** Opciones de los desplegables de ubicación. */
  readonly options = options;
  readonly ciudades = ciudades;

  formPerfil!: FormGroup;

  cargando = true;
  guardando = false;

  /** NIT tal como está en Auth: se muestra, no se edita. */
  readonly nit = this._auth.getCurrentUser()?.displayName ?? '';

  /** Nombre de empresa al cargar, para saber si cambió y sincronizar Auth. */
  private nombreEmpresaOriginal = '';

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
      nombreEmpresa: ['', Validators.required],
      cargoEmpresa: [''],
      departamento: [''],
      direccion: [''],
      emailEmpresa: ['', Validators.email],
      municipio: [''], // Ojo: es el campo ciudad; en base se guarda como municipio
      actividadEmpresa: ['']
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

      // El nombre de empresa vive también en Auth (photoURL), que es de donde
      // lo leen los módulos y las plantillas. Sin esto, el perfil y los
      // documentos mostrarían nombres distintos.
      const nuevoNombre = (datos.nombreEmpresa ?? '').trim();
      if (nuevoNombre && nuevoNombre !== this.nombreEmpresaOriginal) {
        await this._auth.actualizarNombreEmpresa(nuevoNombre);
        this.nombreEmpresaOriginal = nuevoNombre;
      }

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
      this.nombreEmpresaOriginal = (perfil.nombreEmpresa ?? '').trim();
    } catch (error: unknown) {
      console.error('[Perfil] cargarPerfil:', error);
      this._alertaService.showError('No se pudieron cargar tus datos. Revisa tu conexión.');
    } finally {
      this.cargando = false;
    }
  }

  // Los combos de ubicación reciben el FormControl, no el nombre del campo.
  get departamentoControl() {
    return this.formPerfil.get('departamento') as FormControl;
  }

  get ciudadControl() {
    return this.formPerfil.get('municipio') as FormControl;
  }

  /** ¿Mostrar el campo en rojo? Solo tras tocarlo, para no asustar de entrada. */
  invalido(campo: string): boolean {
    const c = this.formPerfil.get(campo);
    return !!c && c.invalid && c.touched;
  }
}
