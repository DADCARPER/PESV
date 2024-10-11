import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators} from '@angular/forms';
import { LoginService } from '../../services/login.service';
import { Router } from '@angular/router';



@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule,ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {

  loginForm: FormGroup;
  errorMessage: string | null = null;

  private _authService = inject(LoginService);
  private _router = inject(Router);

  constructor(private fb: FormBuilder) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;
      this._authService.signInWithEmail(email, password).then(userCredential => {

        const user = userCredential.user;

        console.log('Inicio de sesión exitoso');
        console.log(user.uid);
        console.log(user.email);
        console.log(user.displayName);
        console.log(user.photoURL);
        console.log(user.emailVerified);
        // Guardar userId en sessionStorage
        sessionStorage.setItem('userId', user.uid);
        // Redirigir a la página de dashboard
        this._router.navigate(['/dashboard']);

      }).catch(error => {

        this.errorMessage = 'Error de autenticación: ' + error.message;

      });
    } else {
      this.errorMessage = 'Por favor, completa el formulario correctamente.';
    }
  }

}
