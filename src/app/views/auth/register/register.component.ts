import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { AuthenticacionService } from '../../../services/shared/authenticacion.service';
import { Router, RouterLink } from "@angular/router";
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AlertaInformativoComponent } from "../../../components/alertas/alerta-informativo/alerta-informativo.component";
import { AlertaService } from "../../../services/shared/alerta.service";
import { FirestoreService } from "../../../services/shared/firestore.service";
import { EstatusGeneralService } from "../../../services/shared/estatus-general.service";
import { AaDatosDefaultService } from "../../../services/shared/aa-datos-default.service";


@Component({
  selector: "app-register",
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, AlertaInformativoComponent],
  templateUrl: "./register.component.html",
})
export class RegisterComponent {

  private _auth = inject(AuthenticacionService);
  private _firestore = inject(FirestoreService);
  private _progreso = inject(EstatusGeneralService);
  private _iniciardatos = inject(AaDatosDefaultService);
  private router = inject(Router);
  public _alerta = inject(AlertaService);

  registroForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.registroForm = this.fb.group({
      nombreCompleto: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      nitEmpresa: ['', [Validators.required, Validators.pattern(/^\S+$/)]], // Sin espacios — rompe el path de Firestore
      nombreEmpresa: ['', [Validators.required]],
      cargoEmpresa: [''],
      telefono: [''],
      rol: ['empresa'],
      colaboradores: [''],
      nivelAcceso: ['no']
    });
  }

  async onSubmit() {
    if (!this.registroForm.valid) {
      this.registroForm.markAllAsTouched();
      this._alerta.showWarning('Por favor, completa el formulario correctamente.');
      return;
    }

    const { email, password, nitEmpresa, nombreEmpresa, ...resto } = this.registroForm.value;

    try {
      const userCredential = await this._auth.registerWithEmail(email, password, nitEmpresa, nombreEmpresa);
      const uid = userCredential.user?.uid;

      if (!uid) throw new Error('No se obtuvo el UID del usuario.');

      const datosGuardar = { ...resto, email, nitEmpresa, nombreEmpresa, uid };

      await this._firestore.createDocument('users', datosGuardar, uid);
      await this._firestore.createDocument('Empresas', datosGuardar, nitEmpresa);

      // El servidor lee el NIT de users/{uid} y lo fija como custom claim: es
      // lo que autoriza el acceso a Storage y el cliente no puede falsificarlo.
      // Va después de crear el documento, porque la función lo necesita.
      //
      // Su fallo no puede abortar el registro: la cuenta y los documentos ya
      // existen, y dar "Error al crear la cuenta" sería falso. Si no se asigna
      // aquí, asegurarClaimNit() lo completa en el siguiente inicio de sesión.
      try {
        await this._auth.asignarClaimNit();
      } catch (error: unknown) {
        console.error('[Register] asignarClaimNit:', error);
      }

      await this._progreso.inicializarProgreso(nitEmpresa, new Date().getFullYear());
      await this._iniciardatos.inicializarDatos008Programas(nitEmpresa, new Date().getFullYear());

      this._alerta.showSuccess('Cuenta creada exitosamente.');
      // createUserWithEmailAndPassword ya deja la sesion abierta: va al onboarding,
      // no al formulario de login.
      this.router.navigate(['/starting']);

    } catch (error: unknown) {
      const code = (error as { code?: string }).code;
      switch (code) {
        case 'auth/email-already-in-use':
          this._alerta.showWarning('El correo ya está registrado.');
          break;
        case 'auth/invalid-email':
          this._alerta.showWarning('El formato del correo no es válido.');
          break;
        case 'auth/weak-password':
          this._alerta.showWarning('La contraseña debe tener al menos 8 caracteres.');
          break;
        default:
          this._alerta.showError('Error al crear la cuenta. Verifica tu conexión.');
      }
    }
  }
}
