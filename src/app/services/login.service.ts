import { Injectable } from '@angular/core';
import { Auth, signInWithPopup, User, createUserWithEmailAndPassword } from '@angular/fire/auth';
import { GoogleAuthProvider, signInWithEmailAndPassword } from 'firebase/auth';

@Injectable({
  providedIn: 'root',
})
export class LoginService {

  constructor(private auth: Auth) {}

  // Método para iniciar sesión con Google
  loginWithGoogle() {
    return signInWithPopup(this.auth, new GoogleAuthProvider());
  }

  // Método para iniciar sesión con correo y contraseña
  signInWithEmail(email: string, password: string) {
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  // Método para registrar un usuario con correo y contraseña
  registerWithEmail(email: string, password: string) {
    return createUserWithEmailAndPassword(this.auth, email, password);
  }

  // Método para cerrar sesión
  logout() {
    return this.auth.signOut();
  }
}
