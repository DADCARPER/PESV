import { inject, Injectable, signal, computed } from '@angular/core';
import { AuthenticacionService } from './authenticacion.service';
import { FirestoreService } from './firestore.service';
import { ModelEmpresa } from '../../interfaces/empresas.interface';

type DatosEmpresa = ModelEmpresa.DatosEmpresa;

/**
 * Datos de la empresa en sesión, leídos de `Empresas/{nit}`.
 *
 * Antes la razón social se sacaba de `photoURL` de Firebase Auth, que es un
 * campo pensado para una URL de foto. Funcionaba solo porque el SDK web no lo
 * valida: el Admin SDK sí, y por eso fallaba crear cuentas desde el panel de
 * administración.
 *
 * Se lee una vez por empresa y se comparte, igual que NivelPesvService, en vez
 * de que cada módulo consulte Firestore por su cuenta.
 */
@Injectable({
  providedIn: 'root'
})
export class EmpresaService {

  private _auth = inject(AuthenticacionService);
  private _firestore = inject(FirestoreService);

  /** null mientras no se conoce. */
  datos = signal<DatosEmpresa | null>(null);

  /** El NIT identifica a la empresa y vive en displayName de Auth. */
  readonly nit = computed(() => this._auth.getCurrentUser()?.displayName ?? '');

  /**
   * Razón social. Vacía mientras carga: los sitios que la imprimen deben
   * esperar a `cargar()`, no pintar un nombre a medias en un documento.
   */
  readonly nombre = computed(() => this.datos()?.nombreEmpresa ?? '');

  /** Si ya se sabe, para distinguir "sin nombre" de "aún no cargado". */
  readonly resuelto = computed(() => this.datos() !== null);

  private nitCargado: string | null = null;
  private carga: Promise<void> | null = null;

  /** Carga los datos de la empresa. Si ya se cargaron para ese NIT, no relee. */
  cargar(): Promise<void> {
    const nit = this.nit();
    if (!nit) return Promise.resolve();

    if (nit !== this.nitCargado || !this.carga) {
      this.nitCargado = nit;
      this.datos.set(null);
      this.carga = this.leer(nit);
    }
    return this.carga;
  }

  private async leer(nit: string): Promise<void> {
    try {
      const snap = await this._firestore.getDocument<DatosEmpresa>(`Empresas/${nit}`);
      const datos = snap.data() ?? {} as Partial<DatosEmpresa>;

      const completos: DatosEmpresa = {
        nitEmpresa: nit,
        nombreEmpresa: '',
        ...datos,
      };

      // Hasta ahora estos datos vivían en users/{uid}, mezclados con los de la
      // persona. Si el documento de empresa aún no los tiene, se traen de allí
      // la primera vez: sin esto, quien ya los había rellenado vería la
      // pantalla vacía y creería haberlos perdido.
      if (!completos.nombreEmpresa) {
        const heredados = await this.heredarDelPerfil();
        if (heredados) {
          Object.assign(completos, heredados, { nitEmpresa: nit });
          await this._firestore.upsertDocument(`Empresas/${nit}`, completos);
        }
      }

      this.datos.set(completos);
    } catch (error: unknown) {
      console.error('[Empresa] leer:', error);
      this.carga = null;   // permite reintentar en la próxima llamada
    }
  }

  /**
   * Rescata los datos de empresa del perfil del usuario, de cuando ambos
   * compartían documento. Devuelve null si tampoco están ahí.
   */
  private async heredarDelPerfil(): Promise<Partial<DatosEmpresa> | null> {
    const uid = this._auth.getCurrentUser()?.uid;
    if (!uid) return null;

    try {
      const snap = await this._firestore.getDocument<Record<string, unknown>>(`users/${uid}`);
      const d = snap.data();
      if (!d || !d['nombreEmpresa']) return null;

      const texto = (v: unknown) => (typeof v === 'string' ? v : undefined);

      return {
        nombreEmpresa: texto(d['nombreEmpresa']) ?? '',
        emailEmpresa: texto(d['emailEmpresa']),
        departamento: texto(d['departamento']),
        municipio: texto(d['municipio']),
        direccion: texto(d['direccion']),
        actividadEmpresa: texto(d['actividadEmpresa']),
      };
    } catch (error: unknown) {
      console.error('[Empresa] heredarDelPerfil:', error);
      return null;
    }
  }

  /**
   * Guarda los datos de la empresa y refresca la copia en memoria.
   *
   * El NIT no se toca: identifica el documento y cambiarlo dejaría la empresa
   * apuntando a otra ruta, sin sus documentos.
   */
  async actualizar(cambios: Partial<DatosEmpresa>): Promise<void> {
    const nit = this.nit();
    if (!nit) throw new Error('No hay empresa en sesión');

    const { nitEmpresa, ...resto } = cambios;
    const datos: Partial<DatosEmpresa> = {
      ...resto,
      actualizadoEn: new Date().toISOString(),
    };

    // upsert y no update: updateDoc exige que el documento exista, y Firestore
    // responde PERMISSION_DENIED cuando no es asi, aunque las reglas sean
    // correctas. Empresas/{nit} puede no haberse creado todavia.
    await this._firestore.upsertDocument(`Empresas/${nit}`, datos);

    this.datos.set({
      ...(this.datos() ?? { nitEmpresa: nit, nombreEmpresa: '' }),
      ...datos,
    });
  }

  /** Fuerza una relectura tras guardar desde otra pantalla. */
  invalidar() {
    this.nitCargado = null;
    this.carga = null;
  }
}
