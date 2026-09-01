import { inject, Injectable } from '@angular/core';
import { FirestoreService } from './firestore.service';
import { AuthenticacionService } from './authenticacion.service';
import { StorageService } from './storage.service';
import { AlertaService } from './alerta.service';
import { SlugModulo } from '../../data/modulos-pesv';

/**
 * Motor de los asistentes paso a paso que generan un documento PDF.
 *
 * Sustituye a los cuatro servicios por módulo (líder, comité, política y
 * liderazgo) que repetían el mismo código con distinta colección.
 *
 * Un formulario del asistente es UN documento en:
 *   Empresas/{nit}/periodos/{periodo}/{slug}-asistente/{idFormulario}
 *
 * Ese documento guarda a la vez los datos del formulario y su metadato de
 * avance (`estado`, `tipo`, `URL`, `nombrePDf`). El diseño anterior partía eso
 * en un documento índice más una subcolección, lo que obligaba a leer antes de
 * escribir; `upsertDocument` lo resuelve en una sola operación.
 */

/** Metadatos que el asistente añade a los datos del formulario. */
export interface MetadatosAsistente {
  /** Avance del asistente, 0 a 100. */
  estado: number;
  /** Origen del documento. Hoy siempre 'Asistente'. */
  tipo?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AsistenteFormularioService {

  private _firestore = inject(FirestoreService);
  private _auth = inject(AuthenticacionService);
  private _storage = inject(StorageService);
  private _alerta = inject(AlertaService);

  private get nit(): string | null {
    return this._auth.getCurrentUser()?.displayName ?? null;
  }

  /** Empresas/{nit}/periodos/{periodo}/{slug}-asistente */
  private coleccion(slug: SlugModulo): string {
    return `Empresas/${this.nit}/periodos/${this._auth.periodo()}/${slug}-asistente`;
  }

  private documento(slug: SlugModulo, idFormulario: string): string {
    return `${this.coleccion(slug)}/${idFormulario}`;
  }

  /**
   * Guarda o actualiza el formulario del asistente. Se llama en cada paso,
   * así que no interrumpe al usuario con alertas: si falla, solo deja rastro
   * en consola y el siguiente paso reintenta.
   */
  async autoGuardar(
    slug: SlugModulo,
    idFormulario: string,
    data: Record<string, unknown>,
    meta: MetadatosAsistente
  ): Promise<void> {
    if (!this.nit || !idFormulario || idFormulario === '0') return;

    try {
      await this._firestore.upsertDocument(this.documento(slug, idFormulario), {
        ...data,
        estado: meta.estado,
        tipo: meta.tipo ?? 'Asistente',
      });
    } catch (error: unknown) {
      console.error(`[Asistente] autoGuardar ${slug}/${idFormulario}:`, error);
    }
  }

  /**
   * Devuelve los datos del formulario, o un objeto vacío si no existe.
   * Nunca devuelve el snapshot crudo: quien lo llama no debe saber de Firestore.
   */
  async getFormulario<T extends Record<string, any> = Record<string, any>>(
    slug: SlugModulo,
    idFormulario: string
  ): Promise<T> {
    if (!this.nit || !idFormulario || idFormulario === '0') return {} as T;

    try {
      const snap = await this._firestore.getDocument<T>(this.documento(slug, idFormulario));
      return (snap.data() ?? {}) as T;
    } catch (error: unknown) {
      console.error(`[Asistente] getFormulario ${slug}/${idFormulario}:`, error);
      return {} as T;
    }
  }

  /**
   * Sube el PDF generado y marca el formulario como terminado.
   * Devuelve la URL de descarga, o null si falló.
   */
  async uploadPdf(slug: SlugModulo, idFormulario: string, blob: Blob): Promise<string | null> {
    if (!this.nit || !idFormulario || idFormulario === '0') return null;

    const periodo = this._auth.periodo();
    const ruta = `Empresas/${this.nit}/periodos/${periodo}/${slug}/${idFormulario}.pdf`;

    try {
      const url = await this._storage.uploadFileProgreso(ruta, blob);

      await this._firestore.upsertDocument(this.documento(slug, idFormulario), {
        URL: url,
        nombrePDf: `${idFormulario}.pdf`,
        estado: 100,
      });

      return url;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error al guardar el documento generado';
      console.error(`[Asistente] uploadPdf ${slug}/${idFormulario}:`, error);
      this._alerta.showError(msg);
      return null;
    }
  }
}
