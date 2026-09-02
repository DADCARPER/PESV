import { inject, Injectable } from '@angular/core';
import { AuthenticacionService } from './authenticacion.service';
import { ModelObjetivosMetas as M } from '../../interfaces/objetivosMetas.interface';

/**
 * Evaluación y agregación de la jerarquía de objetivos del PESV.
 *
 * Todo el cálculo sube desde el indicador: el objetivo específico no se captura,
 * se deriva de cuántos de sus indicadores cumplen; y el general, de cuántos de
 * sus específicos quedan alcanzados.
 */
@Injectable({
  providedIn: 'root'
})
export class ObjetivosMetasService {

  private _auth = inject(AuthenticacionService);

  /** Colección del módulo; `sufijo` distingue el nivel de la jerarquía. */
  ruta(sufijo: '' | '-especificos' | '-indicadores' = ''): string {
    const nit = this._auth.getCurrentUser()?.displayName;
    return `Empresas/${nit}/periodos/${this._auth.periodo()}/007-objetivos-metas${sufijo}`;
  }

  // ── Nivel indicador ───────────────────────────────────────────────────────

  /**
   * Compara el valor de un trimestre contra la meta, en el sentido que el
   * propio indicador declara. Sin medición no hay incumplimiento: es 'SIN MEDIR'.
   */
  estadoIndicador(indicador: M.Indicador, trimestre: M.Trimestre): M.EstadoIndicador {
    const valor = indicador.trimestres?.[trimestre];
    if (valor === null || valor === undefined) return 'SIN MEDIR';

    const cumple = indicador.direccion === 'menorIgual'
      ? valor <= indicador.meta
      : valor >= indicador.meta;

    return cumple ? 'CUMPLE' : 'NO CUMPLE';
  }

  /**
   * Valor anual del indicador: promedio de los trimestres medidos. Se promedia
   * y no se suma porque la meta está expresada por trimestre, y sumar cuatro
   * trimestres la haría incomparable.
   */
  valorAnualIndicador(indicador: M.Indicador): number | null {
    const medidos = (indicador.trimestres ?? []).filter((v): v is number => v !== null && v !== undefined);
    if (medidos.length === 0) return null;
    return medidos.reduce((acc, v) => acc + v, 0) / medidos.length;
  }

  /** Estado del indicador frente a su meta usando el valor anual. */
  estadoAnualIndicador(indicador: M.Indicador): M.EstadoIndicador {
    const valor = this.valorAnualIndicador(indicador);
    if (valor === null) return 'SIN MEDIR';

    const cumple = indicador.direccion === 'menorIgual'
      ? valor <= indicador.meta
      : valor >= indicador.meta;

    return cumple ? 'CUMPLE' : 'NO CUMPLE';
  }

  /**
   * Formatea un valor con su unidad, sin decimales sobrantes:
   * 50 → «50%», 50.25 → «50.25%», 3 con unidad Días → «3 Días».
   */
  formatear(valor: number | null | undefined, unidad: string): string {
    if (valor === null || valor === undefined) return '—';

    const redondeado = Math.round(valor * 100) / 100;
    const texto = String(redondeado);   // String() ya descarta los ceros finales

    return unidad === '%' ? `${texto}%` : `${texto} ${unidad}`;
  }

  // ── Nivel objetivo específico ─────────────────────────────────────────────

  /**
   * Avance de un específico en un trimestre: indicadores que cumplen sobre el
   * TOTAL de indicadores creados, igual que el general se mide sobre el total
   * de específicos creados. Un indicador sin medir no cumple, así que pesa en
   * el denominador.
   *
   * La excepción es el trimestre en el que no se midió ni un indicador: ahí
   * devuelve null. No es que nada cumpla, es que el trimestre no ha empezado,
   * y marcarlo en rojo pondría NO ALCANZADO en todos los trimestres futuros
   * desde el primer día del año.
   */
  avanceEspecificoTrimestre(indicadores: M.Indicador[], trimestre: M.Trimestre): number | null {
    if (indicadores.length === 0) return null;

    const hayMedicion = indicadores.some(i => this.estadoIndicador(i, trimestre) !== 'SIN MEDIR');
    if (!hayMedicion) return null;

    const cumplen = indicadores.filter(i => this.estadoIndicador(i, trimestre) === 'CUMPLE').length;
    return (cumplen / indicadores.length) * 100;
  }

  estadoEspecifico(avance: number | null, meta: number): M.EstadoEspecifico {
    if (avance === null) return 'SIN MEDIR';
    return avance >= meta ? 'ALCANZADO' : 'NO ALCANZADO';
  }

  /** Resuelve un específico completo: sus cuatro trimestres, estados y anual. */
  calcularEspecifico(
    especifico: M.ConsultarObjetivoEspecifico,
    indicadores: M.ConsultarIndicador[]
  ): M.AvanceEspecifico {
    const porTrimestre = ([0, 1, 2, 3] as M.Trimestre[])
      .map(t => this.avanceEspecificoTrimestre(indicadores, t));

    const estados = porTrimestre.map(a => this.estadoEspecifico(a, especifico.meta));

    const medidos = porTrimestre.filter((a): a is number => a !== null);
    const avanceAnual = medidos.length > 0
      ? medidos.reduce((acc, v) => acc + v, 0) / medidos.length
      : null;

    return { especifico, indicadores, porTrimestre, estados, avanceAnual };
  }

  // ── Nivel objetivo general ────────────────────────────────────────────────

  /**
   * Cumplimiento del general: específicos alcanzados sobre el TOTAL de
   * específicos. A diferencia del nivel inferior, aquí los que no se han medido
   * sí pesan en el denominador —un objetivo sin medir no está alcanzado—, así
   * que el cumplimiento solo llega a 1 cuando todos lo están.
   */
  calcularGeneral(
    general: M.ConsultarObjetivoGeneral,
    especificos: M.AvanceEspecifico[]
  ): M.AvanceGeneral {
    if (especificos.length === 0) {
      return { general, especificos, cumplimiento: null, estado: 'SIN MEDIR' };
    }

    const alcanzados = especificos.filter(
      e => this.estadoEspecifico(e.avanceAnual, e.especifico.meta) === 'ALCANZADO'
    ).length;

    const cumplimiento = alcanzados / especificos.length;

    return { general, especificos, cumplimiento, estado: this.estadoGeneral(cumplimiento) };
  }

  /** Umbrales del objetivo general: 0,6 marca el parcial y 1 el alcanzado. */
  estadoGeneral(cumplimiento: number): M.EstadoGeneral {
    if (cumplimiento >= 1) return 'ALCANZADO';
    if (cumplimiento >= M.UMBRAL_PARCIAL) return 'ALCANZADO PARCIALMENTE';
    return 'NO ALCANZADO';
  }

  /** Arma la jerarquía completa a partir de las tres colecciones planas. */
  construirJerarquia(
    generales: M.ConsultarObjetivoGeneral[],
    especificos: M.ConsultarObjetivoEspecifico[],
    indicadores: M.ConsultarIndicador[]
  ): M.AvanceGeneral[] {
    return generales.map(general => {
      const hijos = especificos
        .filter(e => e.objetivoGeneralId === general.id)
        .map(e => this.calcularEspecifico(
          e,
          indicadores.filter(i => i.objetivoEspecificoId === e.id)
        ));

      return this.calcularGeneral(general, hijos);
    });
  }

  // ── IDC4 · Cumplimiento de metas PESV ─────────────────────────────────────

  /**
   * Cifras del indicador de autogestión IDC4:
   *
   *   CMPESV = (N° metas alcanzadas / N° metas definidas) × 100
   *
   * Una meta del PESV es la de cada indicador: definidas son todos los
   * indicadores creados en el periodo, y alcanzadas los que CUMPLEN.
   */
  cumplimientoMetasPESV(indicadores: M.Indicador[]): {
    definidas: number;
    alcanzadasTrimestre: number[];
    porcentajeTrimestre: (number | null)[];
    alcanzadasAnual: number;
    porcentajeAnual: number | null;
  } {
    const definidas = indicadores.length;

    const alcanzadasTrimestre = ([0, 1, 2, 3] as M.Trimestre[]).map(
      t => indicadores.filter(i => this.estadoIndicador(i, t) === 'CUMPLE').length
    );

    // Un trimestre sin ninguna medición no es 0%: todavía no hay dato
    const porcentajeTrimestre = ([0, 1, 2, 3] as M.Trimestre[]).map((t, indice) => {
      if (definidas === 0) return null;
      const hayMedicion = indicadores.some(i => this.estadoIndicador(i, t) !== 'SIN MEDIR');
      return hayMedicion ? (alcanzadasTrimestre[indice] / definidas) * 100 : null;
    });

    const alcanzadasAnual = indicadores.filter(i => this.estadoAnualIndicador(i) === 'CUMPLE').length;
    const porcentajeAnual = definidas > 0 ? (alcanzadasAnual / definidas) * 100 : null;

    return { definidas, alcanzadasTrimestre, porcentajeTrimestre, alcanzadasAnual, porcentajeAnual };
  }

  // ── Presentación ──────────────────────────────────────────────────────────

  claseEstadoIndicador(estado: M.EstadoIndicador): string {
    const base = 'text-xs font-semibold inline-block py-1 px-2 rounded whitespace-nowrap';
    if (estado === 'CUMPLE') return `${base} text-emerald-600 bg-emerald-100`;
    if (estado === 'NO CUMPLE') return `${base} text-red-600 bg-red-100`;
    return `${base} text-gray-400 bg-gray-100`;
  }

  claseEstadoEspecifico(estado: M.EstadoEspecifico): string {
    const base = 'text-xs font-semibold inline-block py-1 px-2 rounded whitespace-nowrap';
    if (estado === 'ALCANZADO') return `${base} text-emerald-600 bg-emerald-100`;
    if (estado === 'NO ALCANZADO') return `${base} text-red-600 bg-red-100`;
    return `${base} text-gray-400 bg-gray-100`;
  }

  claseEstadoGeneral(estado: M.EstadoGeneral | 'SIN MEDIR'): string {
    const base = 'text-xs font-semibold inline-block py-1 px-3 rounded whitespace-nowrap';
    if (estado === 'ALCANZADO') return `${base} text-emerald-700 bg-emerald-100`;
    if (estado === 'ALCANZADO PARCIALMENTE') return `${base} text-amber-700 bg-amber-100`;
    if (estado === 'NO ALCANZADO') return `${base} text-red-700 bg-red-100`;
    return `${base} text-gray-400 bg-gray-100`;
  }
}
