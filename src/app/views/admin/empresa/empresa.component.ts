import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { options, ciudades } from '../../../data/categorias-data';
import { EmpresaService } from '../../../services/shared/empresa.service';
import { RolUsuarioService } from '../../../services/shared/rol-usuario.service';
import { AlertaService } from '../../../services/shared/alerta.service';
import { ComboselectComponent } from '../../../components/controlesFormulario/comboselect/comboselect.component';
import { AlertaInformativoComponent } from '../../../components/alertas/alerta-informativo/alerta-informativo.component';

@Component({
  selector: 'app-empresa',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, ComboselectComponent, AlertaInformativoComponent],
  templateUrl: './empresa.component.html',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class EmpresaComponent implements OnInit {

  private fb = inject(FormBuilder);
  private _empresa = inject(EmpresaService);
  private _rol = inject(RolUsuarioService);
  public _alerta = inject(AlertaService);
  private _ruta = inject(ActivatedRoute);
  private _router = inject(Router);

  /**
   * Se muestra al llegar desde el cuestionario inicial (?bienvenida=1). No
   * pide rellenar nada: los datos los carga el administrador al crear la
   * cuenta, asi que lo que toca es que la empresa los verifique.
   */
  mostrarBienvenida = false;

  readonly options = options;
  readonly ciudades = ciudades;

  form!: FormGroup;
  cargando = signal(true);
  guardando = signal(false);

  /** El NIT identifica a la empresa: se muestra, no se edita. */
  readonly nit = this._empresa.nit;

  /** Solo el operativo edita los datos de la empresa; el supervisor los ve. */
  get editable(): boolean {
    return this._rol.editable() && this.tieneEmpresa;
  }

  /**
   * Hay una empresa en sesion. El superadministrador no pertenece a ninguna,
   * y sin esto la pantalla intentaba guardar en una ruta que no es suya.
   */
  get tieneEmpresa(): boolean {
    return !!this.nit();
  }

  ngOnInit(): void {
    this.mostrarBienvenida = this._ruta.snapshot.queryParamMap.get('bienvenida') === '1';
    this.iniciarFormulario();
    this.cargar();
  }

  /**
   * Cierra el aviso y limpia el parametro de la URL, para que no reaparezca
   * al recargar o al volver atras.
   */
  cerrarBienvenida() {
    this.mostrarBienvenida = false;
    this._router.navigate([], {
      relativeTo: this._ruta,
      queryParams: {},
      replaceUrl: true,
    });
  }

  private iniciarFormulario() {
    this.form = this.fb.group({
      nombreEmpresa: ['', Validators.required],
      representanteLegal: [''],
      emailEmpresa: ['', Validators.email],
      telefonoEmpresa: [''],
      departamento: [''],
      municipio: [''],
      direccion: [''],
      actividadEmpresa: [''],
    });
  }

  private async cargar() {
    this.cargando.set(true);
    try {
      await this._empresa.cargar();
      const datos = this._empresa.datos();
      if (datos) this.form.patchValue(datos);

      // Un supervisor no debe poder escribir ni por error: se bloquea el
      // formulario entero, no solo se ocultan los botones.
      if (!this.editable) this.form.disable();
    } catch (error: unknown) {
      console.error('[Empresa] cargar:', error);
      this._alerta.showError('No se pudieron cargar los datos de la empresa.');
    } finally {
      this.cargando.set(false);
    }
  }

  async guardar() {
    if (!this.editable) return;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this._alerta.showWarning('Revisa los campos marcados antes de guardar.');
      return;
    }

    this.guardando.set(true);
    try {
      await this._empresa.actualizar(this.form.value);
      this._alerta.showSuccess('Datos de la empresa actualizados.');
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'No se pudieron guardar los datos';
      console.error('[Empresa] guardar:', error);
      this._alerta.showError(msg);
    } finally {
      this.guardando.set(false);
    }
  }

  get departamentoControl() {
    return this.form.get('departamento') as FormControl;
  }

  get ciudadControl() {
    return this.form.get('municipio') as FormControl;
  }

  invalido(campo: string): boolean {
    const c = this.form.get(campo);
    return !!c && c.invalid && c.touched;
  }
}
