import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { LoginService } from '../../../services/login.service';  // Importamos LoginService
import { Firestore, setDoc, doc } from "@angular/fire/firestore";
import { Router } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { RegistroComponent } from "../../../components/tabs/registro/registro.component";

@Component({
  selector: "app-register",
  standalone: true,
  imports: [CommonModule, FormsModule, RegistroComponent],
  templateUrl: "./register.component.html",
})
export class RegisterComponent {
  user = {
    nitEmpresa: '',
    nombreEmpresa: '',
    nombreCompleto: '',
    cargoEmpresa: '',
    telefono: '',
    email: '',
    password: '',
    nivelAcceso: 'no' // Nivel de acceso por defecto
  };

  constructor(private loginService: LoginService, private firestore: Firestore, private router: Router) {}

  onSubmit() {
    // Registro en Firebase Authentication usando el LoginService
    this.loginService.registerWithEmail(this.user.email, this.user.password).then((userCredential) => {
      const uid = userCredential.user?.uid;

      // Guardar el perfil del usuario en Firestore
      if (uid) {
        const userDocRef = doc(this.firestore, `users/${uid}`);
        setDoc(userDocRef, {
          nitEmpresa: this.user.nitEmpresa,
          nombreEmpresa: this.user.nombreEmpresa,
          nombreCompleto: this.user.nombreCompleto,
          cargoEmpresa: this.user.cargoEmpresa,
          telefono: this.user.telefono,
          email: this.user.email,
          nivelAcceso: this.user.nivelAcceso
        }).then(() => {
          console.log('Usuario registrado y perfil guardado en Firestore.');
          // Redirigir al usuario a la página principal o al dashboard
          this.router.navigate(['/login1']);
        }).catch((error) => {
          console.error('Error al guardar en Firestore:', error);
        });
      }
    }).catch((error) => {
      console.error('Error al registrar el usuario:', error);
    });
  }
}
