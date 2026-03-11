import { computed, inject, Injectable, OnDestroy, signal } from '@angular/core';
import {
  Auth, authState, createUserWithEmailAndPassword, GoogleAuthProvider,
  sendPasswordResetEmail, signInWithEmailAndPassword, signInWithPopup,
  signOut, updatePassword, updateProfile, User
} from '@angular/fire/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthenticacionService implements OnDestroy {

  public auth = inject(Auth);

  // Observable de estado de autenticación (tiempo real)
  authState = authState(this.auth);

  // Signal reactivo del usuario actual
  private userSignal = signal<User | null>(null);
  public userIdSignal = computed(() => this.userSignal()?.uid ?? null);

  // Periodo activo seleccionado en el admin-navbar
  public periodo = signal<number>(new Date().getFullYear());

  private authStateListener: (() => void) | null = null;

  constructor() {
    this.authStateListener = this.auth.onAuthStateChanged((user) => {
      this.userSignal.set(user);
    });
  }

  // Obtiene el usuario actual de forma síncrona
  getCurrentUser(): User | null {
    return this.auth.currentUser;
  }

  // Verifica si hay un usuario autenticado
  isAuthenticated(): boolean {
    return this.userSignal() !== null;
  }

  // Espera a que el estado de autenticación esté listo y devuelve el UID
  waitForUser(): Promise<string | null> {
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

  // Inicio de sesión con email y contraseña
  async signInWithEmail(email: string, password: string) {
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  // Inicio de sesión con Google
  loginWithGoogle() {
    return signInWithPopup(this.auth, new GoogleAuthProvider());
  }

  // Registro con email, contraseña, nombre y empresa (guardado en displayName y photoURL)
  async registerWithEmail(email: string, password: string, displayName?: string, nombreEmpresa?: string) {
    const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
    if (displayName || nombreEmpresa) {
      await updateProfile(userCredential.user, {
        displayName: displayName ?? '',
        photoURL: nombreEmpresa ?? ''
      });
    }
    return userCredential;
  }

  // Cierre de sesión
  logout() {
    return signOut(this.auth);
  }

  // Actualizar contraseña del usuario autenticado
  async updateUserPassword(newPassword: string): Promise<void> {
    const user = this.userSignal();
    if (!user) throw new Error('No hay usuario autenticado');
    try {
      await updatePassword(user, newPassword);
    } catch (error: unknown) {
      throw error;
    }
  }

  // Enviar email de recuperación de contraseña
  async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(this.auth, email);
    } catch (error: unknown) {
      console.error('[Auth] Error al enviar email de recuperación:', error);
      throw error;
    }
  }

  // Establece el periodo activo (llamado desde admin-navbar)
  periodoActual(periodoSeleccionado: number) {
    this.periodo.set(periodoSeleccionado);
  }

  ngOnDestroy() {
    if (this.authStateListener) {
      this.authStateListener();
    }
  }
}
