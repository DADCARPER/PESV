import { Component, OnInit, OnDestroy } from "@angular/core";
import { CommonModule } from "@angular/common";
import { options, ciudades } from '../../../data/categorias-data';
import { ReactiveFormsModule, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';


import { UserProfile } from '../../../interfaces/perfil.interface';

import { LoginService } from '../../../services/login.service';
import { PerfilService } from '../../../services/perfil.service';
import { Subscription } from 'rxjs';
import { ComboselectComponent } from "../../controlesFormulario/comboselect/comboselect.component";

@Component({
  selector: "app-card-settings",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ComboselectComponent],  // Agregamos módulos necesarios
  templateUrl: "./card-settings.component.html",
})
export class CardSettingsComponent implements OnInit, OnDestroy {

  perfil?: UserProfile;
  error?: string;
  loading = true;
  private userSubscription?: Subscription;
  formPerfil: FormGroup = this.fb.group({});
  uid: string = '';

  options = options // Opciones para el desplegable IMPORT
  ciudades = ciudades // Opciones para el desplegable IMPORT 
  filteredOptions = [...this.options];
  showDropdown = false;

  constructor(
    private fb: FormBuilder,
    private _perfil: PerfilService,
    private _UID: LoginService) { }
  

  ngOnInit(): void {

    this.iniciarformulariolimpio();
    // Nos suscribimos al observable user$ que ya tienes en LoginService
    // para obtener el estado del usuario
    this.userSubscription = this._UID.user$.subscribe(user => {
      if (user?.uid) {
        this.uid = user.uid;
        this.cargarPerfil(user.uid);
      } else {
        this.loading = false;
        this.error = 'Usuario no autenticado';
      }
    });

    
  }

  iniciarformulariolimpio() {
    this.formPerfil = this.fb.group({
   
      nombreCompleto: ['', Validators.required],
      email: [{ value: 'Juan Pérez', disabled: true }, [Validators.required, Validators.email]], // Campo deshabilitado
      telefono: ['', Validators.required],
      nombreEmpresa: ['', Validators.required],
      nitEmpresa: ['', Validators.required],
      cargoEmpresa: [''],
      departamento: [''],
      direccion: [''],
      emailEmpresa: [''],
      municipio: [''], //Ojo es el campo ciudad en base se guarda como municipio
      //nivelAcceso: [''],
      actividadEmpresa: ['']
      
    });
  }

  onSubmit() {
    //console.log(this.formPerfil.value);
    if (this.formPerfil.valid) {
      console.log(this.formPerfil.value);
      this._perfil.updatePerfil(this.uid, this.formPerfil.value)
    } else {
      console.log('Formulario inválido');
    }
  }

  private async cargarPerfil(uid: string) {
    try {
      this.loading = true;
      this.perfil = await this._perfil.getPerfilEdit(uid);
      console.log('Perfil:', this.perfil);
      this.formPerfil.patchValue(this.perfil);
    } catch (error) {
      console.error('Error:', error);
      this.error = 'Error al cargar el perfil';
    } finally {
      this.loading = false;
    }
  }

  // Método para obtener el control del formulario
  //importante para el insertar select en el formulario
  get departamentoControl() {
    return this.formPerfil.get('departamento') as FormControl;
  }

  get ciudadControl() {
    return this.formPerfil.get('municipio') as FormControl;
  }

  ngOnDestroy() {
    // Limpiamos la suscripción cuando el componente se destruye
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

}
