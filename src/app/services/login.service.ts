import { computed, inject, Injectable, signal, OnDestroy } from '@angular/core';
import { Auth, signInWithPopup, User, createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, sendPasswordResetEmail, updatePassword  } from '@angular/fire/auth';

@Injectable({
  providedIn: 'root',
})
export class LoginService implements OnDestroy {

  // Signal para manejar el estado del usuario
  private userSignal = signal<User | null>(null);
  // Signal computado para el ID del usuario
  public userIdSignal = computed(() => this.userSignal()?.uid ?? null);

  public errorMessage: string = "";

  public auth = inject(Auth);


  // Listener de autenticación
  private authStateListener: (() => void) | null = null;

  constructor() {
    
    this.authStateListener = this.auth.onAuthStateChanged((user) => {
      this.userSignal.set(user);
      
      if (user) {
        console.log('UID del usuario actual:', user.uid);
      } else {
        console.log('No hay usuario autenticado');
      }
    });

  }

  async waitForUser(): Promise<string | null> {
    return new Promise((resolve) => {
      if (this.userIdSignal() !== null) {
        resolve(this.userIdSignal());
      } else {
        const unsubscribe = this.auth.onAuthStateChanged((user) => {
          resolve(user?.uid ?? null);
          unsubscribe();
        });
      }
    });
  }

  // Método para iniciar sesión con Google
  loginWithGoogle() {
    return signInWithPopup(this.auth, new GoogleAuthProvider());
  }

  // Método para iniciar sesión con correo y contraseña
  async signInWithEmail(email: string, password: string) {
    return signInWithEmailAndPassword( this.auth, email, password);
  }
 
  // Método para verificar si el usuario está autenticado
  isAuthenticated(): boolean {
    return this.userSignal() !== null;
  }

  // Método para registrar un usuario con correo y contraseña
  registerWithEmail(email: string, password: string) {
    return createUserWithEmailAndPassword(this.auth, email, password);
  }

  // Método para cerrar sesión
  logout() {
    return this.auth.signOut();
  }

  //Metodo para actualizar la contraseña 
  async updateUserPassword(newPassword: string): Promise<void> {
  
    try {
      await updatePassword(this.userSignal()!, newPassword);
    } catch (error: any) {
      //console.error('Error al actualizar contraseña:', error);
      throw error;
    }
  }

  // Método para restablecer contraseña mediante un email
  async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(this.auth, email);
      
    } catch (error: any) {
      console.error('Error al enviar email de recuperación:', error);
      //this.errorMessage = this.getResetPasswordErrorMessage(error.code);
      throw error;
    }
  }

  ngOnDestroy() {
    if (this.authStateListener) {
      this.authStateListener();
    }
  }

}
