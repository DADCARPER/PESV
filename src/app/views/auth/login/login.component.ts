import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AlertaInformativoComponent } from '../../../components/alertas/alerta-informativo/alerta-informativo.component';
import { AlertaService } from '../../../services/shared/alerta.service';
import { FirestoreService } from '../../../services/shared/firestore.service';
import { AuthenticacionService } from '../../../services/shared/authenticacion.service';
import { Models } from '../../../interfaces/models';


@Component({
  selector: "app-login",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, AlertaInformativoComponent],
  templateUrl: "./login.component.html",
})
export class LoginComponent {
  loginForm: FormGroup;
  errorMessage: any | null = null;

  private _firestore = inject(FirestoreService);
  private _authService = inject(AuthenticacionService);
  private _router = inject(Router);
  public alertaService = inject(AlertaService);

  constructor(private fb: FormBuilder) {

    // this._authService.authState.subscribe( res => {
    //   console.log('Datos del usuario ->', res?.);
    //   if (res){
    //     this.logiadoMostrar = false;
    //     console.log('Muestra Contenido ->', this.logiadoMostrar);
    //     //this._router.navigate(['/admin/dashboard']);
    //   } else {
    //     this.logiadoMostrar = true; // Mostrar el formulario de login
    //   }

    // });
    
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
        const userCredential = await this._authService.signInWithEmail(email, password); // singInthEmail se encargar de activar el catch.

        // Los claims van primero: el superadministrador no pertenece a ninguna
        // empresa y no tiene ficha en users/, asi que la comprobacion de mas
        // abajo lo expulsaria antes de llegar a reconocerlo.
        try {
          await this._authService.asegurarClaimNit();
        } catch (error: unknown) {
          console.error('[Login] asegurarClaimNit:', error);
        }

        if (await this._authService.esSuperadmin()) {
          this._router.navigate(['/superadmin']);
          return;
        }

        const documento = await this._firestore.getDocument<Models.Users.Usuario>('users/' + userCredential.user.uid);
        const docRef = documento.data();

        // La cuenta existe en Firebase Auth pero no tiene ficha en Firestore:
        // pasa si el registro se interrumpió a medias. Sin esto, la línea
        // siguiente lanzaba un TypeError y dejaba la sesión abierta en la
        // pantalla de login, sin forma de avanzar.
        if (!docRef) {
          await this._authService.logout();
          this.alertaService.showError('Tu cuenta no tiene datos asociados. Comunícate con el administrador.');
          return;
        }

        // Las cuentas creadas desde el panel no traen el nombre de empresa en
        // Auth, porque el Admin SDK rechaza photoURL si no es una URL. Se
        // copia aqui desde Firestore: los modulos y las plantillas lo leen de
        // Auth, y sin esto los documentos saldrian sin nombre de empresa.
        if (!userCredential.user.photoURL && docRef.nombreEmpresa) {
          try {
            await this._authService.actualizarNombreEmpresa(docRef.nombreEmpresa);
          } catch (error: unknown) {
            console.error('[Login] sincronizar nombre de empresa:', error);
          }
        }

        // nivelAcceso 'no' significa que aún no ha completado el registro inicial
        this._router.navigate([docRef.nivelAcceso === 'no' ? '/starting' : '/admin/dashboard']);

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
