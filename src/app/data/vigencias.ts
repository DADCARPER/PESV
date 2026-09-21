import { textoSeguro } from './texto-seguro';

/** Con cuántos días de antelación se avisa de una vigencia próxima. */
export const DIAS_AVISO = 30;

export type EstadoVigencia = 'sinRegistrar' | 'vencido' | 'porVencer' | 'vigente';

/**
 * En qué situación está una fecha límite.
 *
 * Un SOAT caducado deja al vehículo sin poder circular; un plan de emergencias
 * sin revisar deja de valer en una auditoría. En los dos casos la fecha sola no
 * dice nada: hay que compararla con hoy para que sea un hallazgo y no un dato.
 *
 * Se avisa también de lo que está por vencer, que es cuando todavía se puede
 * hacer algo.
 *
 * Las fechas se guardan como texto `AAAA-MM-DD`, que es lo que entrega un
 * `input type="date"`.
 */
export function estadoVigencia(
  fecha: string | undefined | null,
  diasAviso = DIAS_AVISO
): { estado: EstadoVigencia; dias: number } {
  if (!fecha) return { estado: 'sinRegistrar', dias: 0 };

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const limite = new Date(fecha + 'T00:00:00');
  if (isNaN(limite.getTime())) return { estado: 'sinRegistrar', dias: 0 };

  const dias = Math.round((limite.getTime() - hoy.getTime()) / 86400000);
  if (dias < 0) return { estado: 'vencido', dias };
  if (dias <= diasAviso) return { estado: 'porVencer', dias };
  return { estado: 'vigente', dias };
}

/**
 * La celda de una tabla para una fecha límite: la fecha y su situación.
 *
 * Devuelve HTML porque la pintan los `cellRenderer` de ag-grid, que insertan
 * cadenas. El texto va escapado.
 */
export function celdaVigencia(
  fecha: string | undefined | null,
  textos: { vencido: string; porVencer: string; vigente: string } = {
    vencido: 'Vencido hace', porVencer: 'Vence en', vigente: 'Vigente',
  },
  diasAviso = DIAS_AVISO
): string {
  const { estado, dias } = estadoVigencia(fecha, diasAviso);

  if (estado === 'sinRegistrar') {
    return '<span class="text-xs text-gray-300">Sin registrar</span>';
  }

  const aspecto: Record<Exclude<EstadoVigencia, 'sinRegistrar'>, [string, string]> = {
    vencido: ['bg-red-100 text-red-700', `${textos.vencido} ${Math.abs(dias)} d.`],
    porVencer: ['bg-amber-100 text-amber-800', `${textos.porVencer} ${dias} d.`],
    vigente: ['bg-green-100 text-green-700', textos.vigente],
  };

  const [color, etiqueta] = aspecto[estado];

  return `
    <div class="leading-tight">
      <div class="text-xs text-gray-700">${textoSeguro(fecha)}</div>
      <span class="inline-block rounded px-1 text-[10px] font-medium ${color}">${etiqueta}</span>
    </div>`;
}
