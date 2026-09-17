import { inject, Injectable, signal, computed } from '@angular/core';
import { AuthenticacionService } from './authenticacion.service';
import { RolUsuario, aRolUsuario, NOMBRE_ROL, puedeEditar } from '../../data/roles';

/**
 * Rol del usuario en sesión: operativo (construye el PESV) o supervisor
 * (lo revisa sin modificarlo).
 *
 * Lo lee del custom claim `rol` del token, no de Firestore, por dos razones:
 * el token ya viene cargado en el cliente —no hace falta otra consulta— y es
 * la misma fuente que usan las reglas del servidor, así que la interfaz nunca
 * muestra algo que el servidor vaya a rechazar.
 */
@Injectable({
  providedIn: 'root'
})
export class RolUsuarioService {

  private _auth = inject(AuthenticacionService);

  /** null mientras no se conoce; en ese estado no se permite editar. */
  rol = signal<RolUsuario | null>(null);

  /**
   * Si puede modificar la información del PESV.
   *
   * Mientras el rol no se conoce devuelve false, no true: es preferible que un
   * operativo espere una fracción de segundo a que un supervisor alcance a ver
   * botones que el servidor le va a rechazar.
   */
  readonly editable = computed(() => {
    const r = this.rol();
    return r === null ? false : puedeEditar(r);
  });

  /** Si ya se sabe qué rol tiene, para distinguir "no puede" de "aún no sé". */
  readonly resuelto = computed(() => this.rol() !== null);

  /** Nombre legible del rol, para mostrarlo en la interfaz. */
  readonly nombre = computed(() => {
    const r = this.rol();
    return r ? NOMBRE_ROL[r] : '';
  });

  private uidCargado: string | null = null;
  private carga: Promise<void> | null = null;

  /** Carga el rol del usuario actual. Si ya se cargó para ese uid, no relee. */
  cargar(): Promise<void> {
    const uid = this._auth.getCurrentUser()?.uid ?? null;
    if (!uid) return Promise.resolve();

    if (uid !== this.uidCargado || !this.carga) {
      this.uidCargado = uid;
      this.rol.set(null);
      this.carga = this.leer();
    }
    return this.carga;
  }

  private async leer(): Promise<void> {
    try {
      const user = this._auth.getCurrentUser();
      if (!user) return;

      const token = await user.getIdTokenResult();
      this.rol.set(aRolUsuario(token.claims['rol']));
    } catch (error: unknown) {
      console.error('[RolUsuario] leer:', error);
      this.carga = null;   // permite reintentar en la próxima llamada
    }
  }
}
