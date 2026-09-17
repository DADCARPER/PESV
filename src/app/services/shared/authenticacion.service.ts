import { computed, inject, Injectable, OnDestroy, signal } from '@angular/core';
import {
  Auth, authState, createUserWithEmailAndPassword,
  sendPasswordResetEmail, signInWithEmailAndPassword,
  signOut, updatePassword, updateProfile, User
} from '@angular/fire/auth';
import { Functions, httpsCallable } from '@angular/fire/functions';

@Injectable({
  providedIn: 'root'
})
export class AuthenticacionService implements OnDestroy {

  public auth = inject(Auth);
  private _functions = inject(Functions);

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

  /**
   * Pide al servidor que asigne el custom claim `nit` y refresca el token para
   * que las reglas de Storage lo vean de inmediato. Sin ese refresco el claim
   * existe en el servidor, pero el navegador sigue enviando el token anterior
   * y toda subida se rechaza.
   */
  async asignarClaimNit(): Promise<void> {
    const asignar = httpsCallable(this._functions, 'asignarClaimNit');
    await asignar();
    await this.auth.currentUser?.getIdToken(true);
  }

  /**
   * Asigna el claim solo si el token todavía no lo trae. Sirve para reparar
   * cuentas cuyo registro no llegó a asignarlo: al iniciar sesión se completa
   * sin que el usuario tenga que hacer nada.
   */
  async asegurarClaimNit(): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) return;

    const token = await user.getIdTokenResult();
    // El superadministrador no tiene NIT: sin mirar tambien el rol, se pediria
    // el claim en cada inicio de sesion suyo.
    if (token.claims['nit'] || token.claims['rol'] === 'superadmin') return;

    await this.asignarClaimNit();
  }

  /** ¿La sesión actual es de superadministrador? Se lee del claim del token. */
  async esSuperadmin(): Promise<boolean> {
    const user = this.auth.currentUser;
    if (!user) return false;

    const token = await user.getIdTokenResult();
    return token.claims['rol'] === 'superadmin';
  }

  /**
   * Actualiza el nombre de la empresa en Auth (photoURL), que es de donde lo
   * leen los modulos y las plantillas de documentos.
   *
   * El NIT (displayName) no se toca a proposito: identifica a la empresa en
   * Firestore, en Storage y en el custom claim, y cambiarlo aqui dejaria la
   * cuenta apuntando a datos que no son suyos.
   */
  async actualizarNombreEmpresa(nombreEmpresa: string): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('No hay usuario autenticado');

    await updateProfile(user, { photoURL: nombreEmpresa });
    await user.getIdToken(true);
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
