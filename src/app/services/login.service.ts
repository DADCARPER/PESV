import { Injectable } from '@angular/core';
import { Auth, signInWithPopup, User, createUserWithEmailAndPassword } from '@angular/fire/auth';
import { GoogleAuthProvider, signInWithEmailAndPassword } from 'firebase/auth';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class LoginService {

  constructor(public auth: Auth, private firestore: Firestore) {}

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

  // Método para cargar a sessionStorage datos de la empresa que realizo login
  async llamoDatosEmpresa(userId: string) {
    try {
      const userDocRef = doc(this.firestore, `users/${userId}`);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        console.log('Empresa:', userData['nombreEmpresa']);
        console.log('Email:', userData['email']);
        console.log('NIT Empresa:', userData['nitEmpresa']);
        console.log('Teléfono:', userData['telefono']);
        // Almacena los datos en sessionStorage si deseas
        sessionStorage.setItem('empresaData', JSON.stringify(userData));
      } else {
        console.log('No existe el documento para el usuario especificado.');
      }
    } catch (error) {
      console.error('Error al obtener los datos de la empresa:', error);
    }
  }

  // Método para cerrar sesión
  logout() {
    return this.auth.signOut();
  }
}
