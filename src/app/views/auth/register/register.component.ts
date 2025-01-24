import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { LoginService } from '../../../services/login.service';  // Importamos LoginService
import { Router, RouterLink } from "@angular/router";
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators} from '@angular/forms';
import { AlertaInformativoComponent } from "../../../components/alertas/alerta-informativo/alerta-informativo.component";
import { PerfilService } from "../../../services/perfil.service";
import { AlertaService } from "../../../services/alerta.service";


@Component({
  selector: "app-register",
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, AlertaInformativoComponent],
  templateUrl: "./register.component.html",
})
export class RegisterComponent {

  registroForm: FormGroup;
  errorMessage: any | null = null;

  constructor(
    private _loginService: LoginService,
    private fb: FormBuilder,
    private _perfilservice: PerfilService,
    private router: Router,
    public _alerta: AlertaService) {

    this.registroForm = this.fb.group({

      nombreCompleto: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],

      nitEmpresa: ['', [Validators.required]],
      nombreEmpresa: ['', [Validators.required]],
      
      cargoEmpresa: [''],
      telefono: [''],
      nivelAcceso: ['no'] // Nivel de acceso por defecto
    });
    
  }

  async onSubmit() {
    // Registro en Firebase Authentication usando el LoginService

    if (this.registroForm.valid) {
      console.log('Formulario inválido', this.registroForm.value);  
      this._loginService.registerWithEmail(this.registroForm.value.email, this.registroForm.value.password).then((userCredential) => {
        
        const uid = userCredential.user?.uid;
        console.log('Formulario IUD', uid);
        // Guardar el perfil del usuario en Firestore
        if (uid) {
          const userDocRef = this._perfilservice.updatePerfil(uid, this.registroForm.value);
          console.log('Formulario IUD', userDocRef);
          this._alerta.showSuccess('Cuenta creada exitosamente.');
          this.router.navigate(['/auth/login']);
        }
      })
      .catch((error) => {
        switch (error.code) {
          case 'auth/email-already-in-use':
            
            this._alerta.showWarning('El correo ya está registrado.');
            break;
          case 'auth/invalid-email':
            
            this._alerta.showWarning('El formato del correo no es válido.');
            break;
          case 'auth/weak-password':
            
            this._alerta.showWarning('La contraseña debe tener más de 8 caracteres.');
            break;
          default:
            //console.error('Error de conexión a Internet:', error.message);
            this._alerta.showError('Error de conexión a Internet.');
        }
      });
      
    }else{
      console.log('Formulario inválido', this.registroForm.value.email);
      this._alerta.showWarning('Por favor, completa el formulario correctamente.');
    }

    // this.loginService.registerWithEmail(this.user.email, this.user.password).then((userCredential) => {
    //   const uid = userCredential.user?.uid;

    //   // Guardar el perfil del usuario en Firestore
    //   if (uid) {
    //     const userDocRef = doc(this.firestore, `users/${uid}`);
    //     setDoc(userDocRef, {
    //       nitEmpresa: this.user.nitEmpresa,
    //       nombreEmpresa: this.user.nombreEmpresa,
    //       nombreCompleto: this.user.nombreCompleto,
    //       cargoEmpresa: this.user.cargoEmpresa,
    //       telefono: this.user.telefono,
    //       email: this.user.email,
    //       nivelAcceso: this.user.nivelAcceso,
    //       emailEmpresa: '',
    //       departamento: '',
    //       municipio: '',
    //       direccion: '',
    //       actividadEmpresa: '',
    //       logoEmpresaURL: '',
    //       membreteEmpresaURL: '',
    //     }).then(() => {
    //       console.log('Usuario registrado y perfil guardado en Firestore.');
    //       // Redirigir al usuario a la página principal o al dashboard
    //       this.router.navigate(['/login1']);
    //     }).catch((error) => {
    //       console.error('Error al guardar en Firestore:', error);
    //     });
    //   }
    // }).catch((error) => {
    //   console.error('Error al registrar el usuario:', error);
    // });
  }
}
