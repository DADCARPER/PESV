import { inject, Injectable } from '@angular/core';
import { Auth, signInWithPopup, User, createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, UserCredential  } from '@angular/fire/auth';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class LoginService {

  public errorMessage: string = "";

  public auth = inject(Auth);
  public firestore = inject(Firestore);

  // Método para iniciar sesión con Google
  loginWithGoogle() {
    return signInWithPopup(this.auth, new GoogleAuthProvider());
  }

  // Método para iniciar sesión con correo y contraseña
  async signInWithEmail(email: string, password: string) {
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
        // console.log('Empresa:', userData['nombreEmpresa']);
        // console.log('Email:', userData['email']);
        // console.log('NIT Empresa:', userData['nitEmpresa']);
        // console.log('Teléfono:', userData['telefono']);
        // Almacena los datos en sessionStorage si deseas
        sessionStorage.setItem('userId', userId);
        sessionStorage.setItem('empresaData', JSON.stringify(userData));
        if (userData['nivelAcceso'] === 'no'){
          return true;
        }else{
          return false;
        }
      } else {
        return 'No existe el documento para el usuario especificado.';
      }
    } catch (error) {
      
      return 'Error No hay acceso al documento';
      
    }
  }

  // Método para cerrar sesión
  logout() {
    return this.auth.signOut();
  }
}
