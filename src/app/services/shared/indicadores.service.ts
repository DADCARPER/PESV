import { inject, Injectable } from '@angular/core';
import { FirestoreService } from './firestore.service';
import { AuthenticacionService } from './authenticacion.service';
import { AlertaService } from './alerta.service';
import { ModelIndicadores } from '../../interfaces/indicadores.interface';

type Nivel = ModelIndicadores.NivelPerdida;

/**
 * Indicadores de autogestión del PESV (paso 20).
 *
 * Cada indicador es un documento dentro de
 * `Empresas/{nit}/periodos/{periodo}/020-indicadores-reporte-autogestion`.
 * Un solo documento por indicador porque sus datos —doce meses de captura y
 * las metas— siempre se leen y editan en bloque; así no hace falta índice
 * compuesto ni una colección de sesenta documentos por año.
 */
@Injectable({
  providedIn: 'root'
})
export class IndicadoresService {

  private _firestore = inject(FirestoreService);
  private _auth = inject(AuthenticacionService);
  private _alerta = inject(AlertaService);

  private documento(indicador: string): string {
    const nit = this._auth.getCurrentUser()?.displayName;
    return `Empresas/${nit}/periodos/${this._auth.periodo()}/020-indicadores-reporte-autogestion/${indicador}`;
  }

  // ── Indicador 1 · Tasa de siniestros viales ───────────────────────────────

  async getTSV(): Promise<ModelIndicadores.IndicadorTSV> {
    const vacio = ModelIndicadores.indicadorTSVVacio();
    if (!this._auth.getCurrentUser()?.displayName) return vacio;

    try {
      const snap = await this._firestore.getDocument<ModelIndicadores.IndicadorTSV>(this.documento('tsv'));
      const data = snap.data();
      if (!data) return vacio;

      // Normalizamos: un documento viejo o a medias no debe romper el cálculo
      return {
        kilometraje: this.normalizarNumeros(data.kilometraje),
        siniestros: this.normalizarSiniestros(data.siniestros),
        metas: { ...vacio.metas, ...(data.metas ?? {}) },
      };
    } catch (error: unknown) {
      console.error('[Indicadores] getTSV:', error);
      return vacio;
    }
  }

  async guardarTSV(datos: Partial<ModelIndicadores.IndicadorTSV>, mensaje: string): Promise<boolean> {
    try {
      await this._firestore.upsertDocument(this.documento('tsv'), datos);
      this._alerta.showSuccess(mensaje);
      return true;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error al guardar el indicador';
      console.error('[Indicadores] guardarTSV:', error);
      this._alerta.showError(msg);
      return false;
    }
  }

  // ── Cálculo ───────────────────────────────────────────────────────────────

  /**
   * TSV(n) = ( SV(tn) × K ) / km(t)
   *
   * Devuelve null cuando el trimestre no tiene kilómetros registrados: una tasa
   * sin denominador no es cero, es un dato que todavía no existe.
   */
  calcularTrimestres(datos: ModelIndicadores.IndicadorTSV): ModelIndicadores.ResultadoTrimestre[] {
    return ModelIndicadores.TRIMESTRES.map(({ nombre, meses }) => {
      const kilometros = meses.reduce((acc, m) => acc + (datos.kilometraje[m] || 0), 0);

      const siniestros = {} as Record<Nivel, number>;
      const tsv = {} as Record<Nivel, number | null>;

      for (const { clave } of ModelIndicadores.NIVELES_PERDIDA) {
        const total = meses.reduce((acc, m) => acc + (datos.siniestros[m]?.[clave] || 0), 0);
        siniestros[clave] = total;
        tsv[clave] = kilometros > 0
          ? Number(((total * ModelIndicadores.K_TSV) / kilometros).toFixed(2))
          : null;
      }

      return { nombre, kilometros, siniestros, tsv };
    });
  }

  /** TSV del año: usa los kilómetros y siniestros acumulados de los doce meses. */
  calcularAnual(datos: ModelIndicadores.IndicadorTSV): Record<Nivel, number | null> {
    const kilometros = datos.kilometraje.reduce((acc, km) => acc + (km || 0), 0);
    const resultado = {} as Record<Nivel, number | null>;

    for (const { clave } of ModelIndicadores.NIVELES_PERDIDA) {
      const total = datos.siniestros.reduce((acc, mes) => acc + (mes?.[clave] || 0), 0);
      resultado[clave] = kilometros > 0
        ? Number(((total * ModelIndicadores.K_TSV) / kilometros).toFixed(2))
        : null;
    }
    return resultado;
  }

  /**
   * Qué tan cerca está el resultado de la meta, en porcentaje.
   * En siniestralidad menos es mejor: estar por debajo de la meta es 100%.
   */
  cumplimiento(valor: number | null, meta: number): number {
    if (valor === null) return 0;
    if (valor <= meta) return 100;
    if (valor === 0) return 100;
    return Math.max(0, Math.round((meta / valor) * 100));
  }

  // ── Normalización ─────────────────────────────────────────────────────────

  private normalizarNumeros(valores: unknown): number[] {
    const base = Array(12).fill(0);
    if (!Array.isArray(valores)) return base;
    return base.map((_, i) => Number(valores[i]) || 0);
  }

  private normalizarSiniestros(valores: unknown): ModelIndicadores.SiniestrosMes[] {
    return Array.from({ length: 12 }, (_, i) => {
      const mes = Array.isArray(valores) ? valores[i] : null;
      return { ...ModelIndicadores.siniestrosVacios(), ...(mes ?? {}) };
    });
  }
}
