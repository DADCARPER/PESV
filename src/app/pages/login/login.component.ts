import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators} from '@angular/forms';
import { LoginService } from '../../services/login.service';
import { Router, RouterLink } from '@angular/router';
import { AuthErrorCodes } from 'firebase/auth';
import { AlertaInformativoComponent } from "../../components/alertas/alerta-informativo/alerta-informativo.component";
import { AlertaService } from '../../services/alerta.service';



@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, AlertaInformativoComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {

  loginForm: FormGroup;
  errorMessage: any | null = null;

  private _authService = inject(LoginService);
  private _router = inject(Router);
  public alertaService = inject(AlertaService);

  constructor(private fb: FormBuilder) {
    
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
    
  }

  async onSubmit() {
    if (this.loginForm.valid) {
      
      try {
        const { email, password } = this.loginForm.value;
  
        // Autenticar al usuario y obtener el objeto `user`
        const userCredential = await this._authService.signInWithEmail(email, password);
        console.log(userCredential);
       
        const user = userCredential.user;
  
        // Esperar a que se obtengan los datos de la empresa
        const sesioncreada = await this._authService.llamoDatosEmpresa(user.uid);
        console.log('Inicio de sesión exitoso '+sesioncreada);

        if (sesioncreada){
          this._router.navigate(['/starting']);
        }else{
          this._router.navigate(['/admin/dashboard']);
        }
  
      //   // Guardar userId en sessionStorage y medir el tiempo
      //   console.time("Guardar en sessionStorage");
      //   sessionStorage.setItem('userId', user.uid);
      //   console.timeEnd("Guardar en sessionStorage");
  
      } catch (error:any) {

        // Manejo de errores basado en códigos específicos
        switch (error.code) {
          case 'auth/invalid-email':
            console.error('Correo electrónico no válido');
            this.alertaService.showError('El formato del correo electrónico no es válido.');
            break;
          case 'auth/user-disabled':
            console.error('Usuario deshabilitado');
            this.alertaService.showError('La cuenta de usuario ha sido deshabilitada.');
            break;
          case 'auth/user-not-found':
            console.error('Usuario no encontrado');
            this.alertaService.showError('No existe una cuenta con este correo.');
            break;
          case 'auth/wrong-password':
            console.error('Contraseña incorrecta');
            this.alertaService.showError('La contraseña ingresada es incorrecta.');
            break;
          case 'auth/too-many-requests':
            console.error('Demasiados intentos fallidos');
            this.alertaService.showError('Acceso temporalmente bloqueado. Inténtalo más tarde.');
            break;
          case 'auth/network-request-failed':
            console.error('Error de red');
            this.alertaService.showError('Error de red. Verifica tu conexión.');
            break;
          default:
            console.error('Error inesperado:', error.message);
            this.alertaService.showError('Ocurrió un error inesperado. Inténtalo de nuevo.');
        }
        

        //this.errorMessage = 'Error de autenticación: ' + error.code;
        //console.log(this.errorMessage);
      }
      
    } else {
      //this.errorMessage = 'Por favor, completa el formulario correctamente.';
      //this.showWarningAlert('Por favor, completa el formulario correctamente.');
      this.alertaService.showWarning('Por favor, completa el formulario correctamente.');
    }
  }


}
