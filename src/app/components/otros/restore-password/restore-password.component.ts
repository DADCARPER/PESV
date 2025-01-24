import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { LoginService } from '../../../services/login.service';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-restore-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './restore-password.component.html',
  styleUrl: './restore-password.component.css'
})
export class RestorePasswordComponent {

  passwordForm: FormGroup;
  cargando = false;
  mensaje: { texto: string; tipo: 'error' | 'success' } | null = null;

  constructor(
    private fb: FormBuilder,
    private loginService: LoginService
  ) {
    this.passwordForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validator: this.passwordMatchValidator });
  }

  async onSubmit() {
    if (this.passwordForm.invalid) return;

    this.cargando = true;
    this.mensaje = null;

    try {
      await this.loginService.updateUserPassword(
        this.passwordForm.get('newPassword')?.value
      );
      
      this.mensaje = {
        texto: 'Contraseña actualizada exitosamente',
        tipo: 'success'
      };
      this.passwordForm.reset();
    } catch (error: any) {
      this.mensaje = {
        texto: this.getErrorMessage(error.code),
        tipo: 'error'
      };
    } finally {
      this.cargando = false;
    }
  }

  private passwordMatchValidator(g: FormGroup) {
    return g.get('newPassword')?.value === g.get('confirmPassword')?.value
      ? null 
      : { passwordMismatch: true };
  }

  private getErrorMessage(errorCode: string): string {
    switch (errorCode) {
      case 'auth/requires-recent-login':
        return 'Por seguridad, necesitas volver a iniciar sesión antes de cambiar tu contraseña';
      case 'auth/weak-password':
        return 'La contraseña es demasiado débil. Debe tener al menos 6 caracteres';
      default:
        return 'Error al actualizar la contraseña. Por favor, intenta nuevamente';
    }
  }
  
}
