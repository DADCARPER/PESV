import { inject, Injectable, signal } from '@angular/core';
import { AuthenticacionService } from './authenticacion.service';
import { FirestoreService } from './firestore.service';
import { Models } from '../../interfaces/models';
import { NivelPesv, NOMBRE_NIVEL, aplicaANivel, esNivelPesv } from '../../data/modulos-pesv';

/**
 * Nivel PESV de la empresa en sesión (Básico, Estándar o Avanzado) y qué pasos
 * le son exigibles.
 *
 * Lee `users/{uid}.nivelAcceso` una sola vez por usuario y lo comparte con el
 * navbar y los tableros de las cuatro fases, en vez de que cada uno lo consulte.
 */
@Injectable({
  providedIn: 'root'
})
export class NivelPesvService {

  private _auth = inject(AuthenticacionService);
  private _firestore = inject(FirestoreService);

  /** null mientras no se conoce; en ese estado todos los pasos se tratan como exigibles. */
  nivel = signal<NivelPesv | null>(null);

  private uidCargado: string | null = null;
  private carga: Promise<void> | null = null;

  /** Carga el nivel del usuario actual. Si ya se cargó para ese mismo usuario, no vuelve a leer. */
  cargar(): Promise<void> {
    const uid = this._auth.getCurrentUser()?.uid ?? null;
    if (!uid) return Promise.resolve();

    if (uid !== this.uidCargado || !this.carga) {
      this.uidCargado = uid;
      this.nivel.set(null);
      this.carga = this.leer(uid);
    }
    return this.carga;
  }

  private async leer(uid: string): Promise<void> {
    try {
      // El nivel es de la empresa: lo define el cuestionario una vez y vale
      // para todos sus usuarios. Se mira su documento antes que el del
      // usuario, donde vivia hasta ahora.
      const nit = this._auth.getCurrentUser()?.displayName;
      let valor: string | undefined;

      if (nit) {
        const empresa = await this._firestore.getDocument<{ nivelAcceso?: string }>('Empresas/' + nit);
        valor = empresa.data()?.nivelAcceso;
      }

      if (!valor) {
        const snap = await this._firestore.getDocument<Models.Users.Usuario>('users/' + uid);
        valor = snap.data()?.nivelAcceso;
      }

      this.nivel.set(esNivelPesv(valor) ? valor : null);
    } catch (error: unknown) {
      console.error('[NivelPesv] leer:', error);
      this.carga = null;   // permite reintentar en la próxima llamada
    }
  }

  /** Fija el nivel recién calculado en el cuestionario, sin esperar a releer Firestore. */
  establecer(nivel: NivelPesv) {
    this.uidCargado = this._auth.getCurrentUser()?.uid ?? null;
    this.nivel.set(nivel);
    this.carga = Promise.resolve();
  }

  /** ¿Se le exige este módulo a la empresa en sesión? */
  aplica(slug: string): boolean {
    return aplicaANivel(slug, this.nivel());
  }

  /** Nombre oficial del nivel: Básico, Estándar o Avanzado. Vacío si aún no se conoce. */
  nombre(): string {
    const n = this.nivel();
    return n ? NOMBRE_NIVEL[n] : '';
  }
}
