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

  /**
   * Cuántas empresas están usando esta encuesta del catálogo.
   *
   * Es informativo, no un candado: cada empresa trabaja sobre su propia copia,
   * así que editar el catálogo no le toca el cuestionario a nadie. Sirve para
   * que el administrador sepa el alcance de lo que cambia.
   */
  async contarUsos(encuestaId: string): Promise<number> {
    return this._firestore.contarDocumentos(
      'cuestionarios',
      [['encuestaId', '==', encuestaId]],
      true
    );
  }

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
   * Guarda los cambios de una encuesta del catálogo.
   *
   * No hace falta comprobar nada: las empresas trabajan sobre su propia copia,
   * tomada el día que activaron la encuesta, así que editar aquí no altera
   * ningún cuestionario ya en uso ni deja respuestas contestando a preguntas
   * que cambiaron.
   */
  async actualizar(id: string, cambios: Partial<ModelsEncuestas.Encuesta>): Promise<void> {
    await this._firestore.updateDocument(`${COLECCION}/${id}`, cambios);
  }

  /**
   * Copia una encuesta como borrador.
   *
   * Es el único camino para cambiar una encuesta que ya tiene respuestas: se
   * trabaja sobre la copia mientras las empresas siguen usando la original,
   * y las respuestas ya recogidas se quedan con el cuestionario al que
   * realmente contestaron.
   */
  async duplicar(id: string): Promise<void> {
    const original = await this.obtener(id);
    if (!original) throw new Error('La encuesta que quieres copiar ya no existe');

    const { id: _id, docCreado, docActualizado, ...resto } = original;
    await this.crear({
      ...resto,
      nombre: `${original.nombre} (v${original.version + 1})`,
      version: original.version + 1,
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
