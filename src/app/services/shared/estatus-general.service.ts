import { Injectable, inject, signal } from '@angular/core';
import { AuthenticacionService } from './authenticacion.service';
import { FirestoreService } from './firestore.service';
import { Models } from '../../interfaces/models';
import { SlugModulo } from '../../data/modulos-pesv';

/**
 * Única vía de lectura y escritura del progreso de los módulos PESV.
 *
 * El documento vive en `EstatusGeneral/{nit}` — indexado por NIT de la empresa
 * (displayName), nunca por UID. Cada módulo guarda su avance bajo su slug
 * canónico de `data/modulos-pesv.ts`.
 */
@Injectable({
  providedIn: 'root'
})
export class EstatusGeneralService {

  private _auth = inject(AuthenticacionService);
  private _firestore = inject(FirestoreService);
  private coleccion = 'EstatusGeneral';

  estatusGeneral = signal<Partial<Models.Procesos.ProcesosCarga>>({});

  private getNit(): string | null {
    return this._auth.getCurrentUser()?.displayName ?? null;
  }

  // ── Estado local ──────────────────────────────────────────────────────────

  setEstatusGeneralLocal(data: Partial<Models.Procesos.ProcesosCarga>) {
    this.estatusGeneral.set(data);
  }

  getEstatusGeneralLocal() {
    return this.estatusGeneral();
  }

  // ── Progreso por módulo ───────────────────────────────────────────────────

  /**
   * Registra el avance de un módulo. Es la única forma en que un módulo debe
   * reportar progreso: recibe su slug canónico y sus contadores ya calculados.
   *
   * @example
   * await this._estatus.registrarProgreso('003-politicas-seguridad-vial', {
   *   total_progreso: this.documento1.length > 0 ? 100 : 0,
   *   actaPolitica: { total: this.documento1.length > 0 ? 1 : 0 },
   * });
   */
  async registrarProgreso<T extends Models.Procesos.ProgresoModulo>(
    slug: SlugModulo,
    datos: T
  ): Promise<void> {
    const nit = this.getNit();
    if (!nit) return;

    try {
      await this._firestore.upsertDocument(`${this.coleccion}/${nit}`, {
        periodo: this._auth.periodo(),
        [slug]: datos,
      });
    } catch (error: unknown) {
      console.error(`[EstatusGeneral] registrarProgreso ${slug}:`, error);
    }
  }

  /**
   * Siembra el documento de progreso al crear la empresa, con todos los módulos
   * en cero. Recibe el NIT por parámetro porque en el registro la sesión de
   * Firebase Auth todavía no tiene el displayName propagado.
   */
  async inicializarProgreso(nitEmpresa: string, periodo: number): Promise<void> {
    const datos: Partial<Models.Procesos.ProcesosCarga> = {
      periodo,
      Total_General: 0,
      '001-lider-pesv': {
        total_progreso: 0,
        docIdentidad: { total: 0 },
        actaLiderpesv: { total: 0 },
        certificadoCompetencia: { total: 0 },
        docExperienciaProfesional: { total: 0 },
      },
      '002-comite-seguridad-vial': {
        total_progreso: 0,
        actacomite: { total: 0 },
      },
      '003-politicas-seguridad-vial': {
        total_progreso: 0,
        actaPolitica: { total: 0 },
      },
      '004-liderazgo-compromiso': {
        total_progreso: 0,
        actaLiderazgo: { total: 0 },
      },
      '006-diagnostico': {
        total_progreso: 0,
        InfoOrganizacional: { total: 0 },
        colaboradores: { total: 0 },
        flota: { total: 0 },
        contratistas: { total: 0 },
        rutas: { total: 0 },
        emergencias: { total: 0 },
      },
    };

    try {
      await this._firestore.createDocument(this.coleccion, datos, nitEmpresa);
    } catch (error: unknown) {
      console.error('[EstatusGeneral] inicializarProgreso:', error);
      throw error;
    }
  }

  // ── Documento completo ────────────────────────────────────────────────────

  async setEstatusGeneralFirestore(data: Partial<Models.Procesos.ProcesosCarga>) {
    const nit = this.getNit();
    if (!nit) return null;
    try {
      return await this._firestore.upsertDocument(`${this.coleccion}/${nit}`, data);
    } catch (error: unknown) {
      console.error('[EstatusGeneral] setEstatusGeneralFirestore:', error);
      return null;
    }
  }

  async getEstatusGeneralFirestore() {
    const nit = this.getNit();
    if (!nit) return null;
    try {
      const snap = await this._firestore.getDocument<Models.Procesos.ProcesosCarga>(`${this.coleccion}/${nit}`);
      return snap.data() ?? null;
    } catch (error: unknown) {
      console.error('[EstatusGeneral] getEstatusGeneralFirestore:', error);
      return null;
    }
  }
}
