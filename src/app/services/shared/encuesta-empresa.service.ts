import { Injectable, inject } from '@angular/core';
import { FirestoreService } from './firestore.service';
import { AuthenticacionService } from './authenticacion.service';
import { EmpresaService } from './empresa.service';
import { ModelsEncuestas } from '../../interfaces/encuestas.interface';

/**
 * La encuesta que una empresa tiene activa en un periodo.
 *
 * Al activarla se guarda una **copia entera** del cuestionario, no una
 * referencia al catálogo. Un diagnóstico tiene que poder reproducirse años
 * después, y apuntando al catálogo dependería de un documento que el
 * administrador sigue editando.
 *
 * Con la copia el congelado también es suyo: en cuanto llega la primera
 * respuesta su cuestionario queda fijo, sin que eso ate a las demás empresas
 * ni impida al administrador seguir trabajando en el catálogo.
 */
@Injectable({ providedIn: 'root' })
export class EncuestaEmpresaService {

  private _firestore = inject(FirestoreService);
  private _auth = inject(AuthenticacionService);
  private _empresa = inject(EmpresaService);

  /** Documento raíz que lee el formulario público, que no tiene sesión. */
  rutaPublica(nit: string): string {
    return `Encuestas_publicas/${nit}`;
  }

  /**
   * La copia de un periodo concreto.
   *
   * Se llama `cuestionarios` y no `periodos` a proposito: `Empresas/{nit}/
   * periodos` ya existe para los datos del PESV, y una consulta de grupo sobre
   * `periodos` mezclaria las dos cosas y obligaria a dar al administrador
   * acceso de lectura a los datos de las empresas.
   */
  rutaPeriodo(nit: string, periodo: number): string {
    return `Encuestas_publicas/${nit}/cuestionarios/${periodo}`;
  }

  /** Dónde caen las respuestas. */
  rutaRespuestas(nit: string): string {
    return `Encuestas_publicas/${nit}/encuestas`;
  }

  /**
   * Las respuestas del periodo.
   *
   * Son la Lista de Colaboradores: cada persona que contestó la encuesta es
   * una ficha. Se filtra por periodo en la consulta, con un solo campo de
   * igualdad para no necesitar índice compuesto.
   */
  async respuestas(periodo = this._auth.periodo()): Promise<Record<string, any>[]> {
    const snap = await this._firestore.getDocumentsQuery<Record<string, any>>(
      this.rutaRespuestas(this.nit()),
      [['periodo', '==', periodo]]
    );
    return snap.docs.map(d => d.data());
  }

  /** Corrige una respuesta ya enviada, por ejemplo una cédula mal tecleada. */
  async corregir(id: string, cambios: Record<string, unknown>): Promise<void> {
    await this._firestore.updateDocument(`${this.rutaRespuestas(this.nit())}/${id}`, cambios);
  }

  async eliminarRespuesta(id: string): Promise<void> {
    await this._firestore.deleteDocument(`${this.rutaRespuestas(this.nit())}/${id}`);
  }

  /**
   * El módulo que identifica a la persona: nombre, documento, cargo, área.
   *
   * Es el que la encuesta marca como fijo, y sus preguntas son las columnas de
   * la Lista de Colaboradores. Se saca del cuestionario del periodo y no de una
   * lista escrita en el código, para que cambiar la encuesta cambie la tabla.
   */
  async moduloPersonal(): Promise<ModelsEncuestas.Modulo | null> {
    const copia = await this.activa();
    return copia?.modulos.find(m => m.fijo) ?? null;
  }

  /** La copia activa de esta empresa en este periodo, si la hay. */
  async activa(): Promise<ModelsEncuestas.EncuestaActiva | null> {
    const nit = this.nit();
    const snap = await this._firestore.getDocument<ModelsEncuestas.EncuestaActiva>(
      this.rutaPeriodo(nit, this._auth.periodo())
    );
    return snap.exists() ? snap.data() : null;
  }

  /**
   * Cuántas respuestas lleva el periodo.
   *
   * Es lo que congela el cuestionario de esta empresa. Se cuenta en el
   * servidor: con muestreo pueden ser miles.
   */
  async contarRespuestas(periodo: number): Promise<number> {
    return this._firestore.contarDocumentos(
      this.rutaRespuestas(this.nit()),
      [['periodo', '==', periodo]]
    );
  }

  /**
   * Toma la copia del catálogo y la deja como cuestionario del periodo.
   *
   * Se niega si ya hay respuestas: cambiar el cuestionario a mitad de la
   * recogida dejaría unas respuestas contestando a unas preguntas y otras a
   * otras, y el diagnóstico no cuadraría consigo mismo.
   */
  async activar(
    encuesta: ModelsEncuestas.Encuesta,
    modulosActivos: string[]
  ): Promise<void> {
    const nit = this.nit();
    const periodo = this._auth.periodo();

    const respuestas = await this.contarRespuestas(periodo);
    if (respuestas > 0) {
      throw new Error(
        `Este periodo ya tiene ${respuestas} respuestas. Para cambiar de cuestionario ` +
        'hay que eliminarlas primero desde Resultados de encuesta.'
      );
    }

    const copia: ModelsEncuestas.EncuestaActiva = {
      encuestaId: encuesta.id,
      version: encuesta.version,
      nombre: encuesta.nombre,
      descripcion: encuesta.descripcion,
      modulos: encuesta.modulos,
      periodo,
      modulosActivos,
      mostrarEncuesta: false,
      fechaActivacion: new Date().toISOString(),
    };

    await this._firestore.upsertDocument(this.rutaPeriodo(nit, periodo), copia);
    await this.sincronizarPublico(nit, periodo, copia.mostrarEncuesta);
  }

  /**
   * Cambia qué módulos se preguntan, o abre y cierra el enlace público.
   *
   * Los módulos solo se pueden tocar mientras no haya respuestas: si a mitad
   * de camino se activa uno nuevo, quienes ya contestaron no lo respondieron y
   * sus datos quedan incompletos sin que se note.
   */
  async ajustar(cambios: Partial<ModelsEncuestas.EncuestaActiva>): Promise<void> {
    const nit = this.nit();
    const periodo = this._auth.periodo();

    if (cambios.modulosActivos) {
      const respuestas = await this.contarRespuestas(periodo);
      if (respuestas > 0) {
        throw new Error(
          'Ya hay respuestas en este periodo: los módulos no se pueden cambiar. ' +
          'Quienes ya contestaron no responderían a los nuevos.'
        );
      }
    }

    await this._firestore.updateDocument(this.rutaPeriodo(nit, periodo), cambios);

    if (cambios.mostrarEncuesta !== undefined) {
      await this.sincronizarPublico(nit, periodo, cambios.mostrarEncuesta);
    }
  }

  /**
   * El documento raíz dice qué periodo está abierto y si se admiten
   * respuestas.
   *
   * Existe porque quien responde no tiene sesión y por tanto no sabe en qué
   * periodo está: necesita una sola lectura que le diga dónde mirar.
   */
  private async sincronizarPublico(nit: string, periodo: number, abierta: boolean) {
    await this._firestore.upsertDocument(this.rutaPublica(nit), {
      nombreEmpresa: this._empresa.nombre(),
      periodoActivo: periodo,
      mostrarEncuesta: abierta,
    });
  }

  private nit(): string {
    const nit = this._empresa.nit();
    if (!nit) throw new Error('No hay empresa en sesión');
    return nit;
  }
}
