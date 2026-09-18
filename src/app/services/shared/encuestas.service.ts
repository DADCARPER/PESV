import { Injectable, inject } from '@angular/core';
import { FirestoreService } from './firestore.service';
import { ModelsEncuestas } from '../../interfaces/encuestas.interface';
import { ENCUESTA_PESV_BASE } from '../../data/encuesta-pesv-base';

/**
 * Las encuestas son del sistema, no de cada empresa.
 *
 * Viven en una colección de primer nivel porque las preguntas las fija la
 * norma y valen para todas: si cada empresa tuviera su copia, un cambio de la
 * Resolución habría que replicarlo empresa por empresa y los resultados
 * dejarían de ser comparables entre unas y otras.
 *
 * Escribe solo el superadministrador; lo vigilan las reglas de Firestore, no
 * esta clase.
 */
const COLECCION = 'Encuestas';

@Injectable({ providedIn: 'root' })
export class EncuestasService {

  private _firestore = inject(FirestoreService);

  /** Todas las encuestas, la más reciente primero. */
  async listar(): Promise<ModelsEncuestas.Encuesta[]> {
    const snap = await this._firestore.getDocuments<ModelsEncuestas.Encuesta>(COLECCION);
    return snap.docs
      .map((d) => d.data())
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  }

  async obtener(id: string): Promise<ModelsEncuestas.Encuesta | null> {
    const snap = await this._firestore.getDocument<ModelsEncuestas.Encuesta>(`${COLECCION}/${id}`);
    return snap.exists() ? snap.data() : null;
  }

  async crear(encuesta: Omit<ModelsEncuestas.Encuesta, 'id'>): Promise<void> {
    await this._firestore.createDocument(COLECCION, { ...encuesta });
  }

  /**
   * Guarda los cambios de una encuesta.
   *
   * Publicar sube la versión. Las respuestas guardan con qué versión se
   * contestaron, así que editar una encuesta no reescribe lo ya respondido:
   * quien lea resultados antiguos sabe a qué preguntas contestaban.
   */
  async actualizar(
    id: string,
    cambios: Partial<ModelsEncuestas.Encuesta>,
    subirVersion = false
  ): Promise<void> {
    const datos: Partial<ModelsEncuestas.Encuesta> = { ...cambios };

    if (subirVersion) {
      const actual = await this.obtener(id);
      datos.version = (actual?.version ?? 0) + 1;
    }

    await this._firestore.updateDocument(`${COLECCION}/${id}`, datos);
  }

  /**
   * Copia una encuesta como borrador.
   *
   * Es la forma segura de cambiar una encuesta que ya tiene respuestas: se
   * trabaja sobre la copia y las empresas siguen usando la original hasta que
   * la nueva esté lista.
   */
  async duplicar(id: string): Promise<void> {
    const original = await this.obtener(id);
    if (!original) throw new Error('La encuesta que quieres copiar ya no existe');

    const { id: _id, docCreado, docActualizado, ...resto } = original;
    await this.crear({
      ...resto,
      nombre: `${original.nombre} (copia)`,
      version: 1,
      estado: 'borrador',
    });
  }

  /**
   * Deja la encuesta de la Resolución en Firestore si aún no está.
   *
   * Es la migración de la encuesta que vivía escrita en el código. Se ejecuta
   * desde el gestor y no hace nada si ya existe alguna encuesta, para no
   * duplicarla cada vez que alguien abre la pantalla.
   */
  async sembrarBase(): Promise<boolean> {
    const existentes = await this.listar();
    if (existentes.length > 0) return false;

    await this.crear(ENCUESTA_PESV_BASE);
    return true;
  }
}
