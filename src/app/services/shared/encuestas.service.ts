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
   * Cuántas respuestas se han recogido con esta encuesta, en todas las
   * empresas.
   *
   * Es lo que decide si la encuesta se puede seguir editando. Se cuenta sobre
   * el grupo de subcolecciones `encuestas`, que vive repartido bajo cada
   * empresa, en vez de recorrer las empresas una a una.
   */
  async contarRespuestas(encuestaId: string): Promise<number> {
    return this._firestore.contarDocumentos(
      'encuestas',
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
   * Guarda los cambios de una encuesta.
   *
   * Solo tiene sentido mientras nadie la haya respondido. En cuanto hay
   * respuestas la encuesta queda congelada y el camino es duplicarla: se
   * comprueba aquí y no solo en la pantalla, porque un diagnóstico es un
   * documento que la empresa presenta ante la autoridad y tiene que poder
   * reproducirse tal como se respondió.
   */
  async actualizar(id: string, cambios: Partial<ModelsEncuestas.Encuesta>): Promise<void> {
    const respuestas = await this.contarRespuestas(id);
    if (respuestas > 0) {
      throw new Error(
        `Esta encuesta ya tiene ${respuestas} respuestas y no se puede modificar. ` +
        'Duplícala y trabaja sobre la copia.'
      );
    }

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
