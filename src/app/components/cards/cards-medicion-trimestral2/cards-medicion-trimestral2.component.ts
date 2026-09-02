import { CommonModule } from '@angular/common';
import { Component, Input, computed, signal } from '@angular/core';
import { ProgressBarDobleComponent } from '../../otros/progress-bar-doble/progress-bar-doble.component';

/** Un trimestre ya resuelto para pintar. */
interface Trimestre {
  subtitulo: string;
  actual: number | null;
  meta: number;
  /** actual sobre meta, en porcentaje; null cuando no hay dato. */
  porcentaje: number | null;
  texto: string;
}

/**
 * Medición trimestral de un indicador: cuatro bloques con el valor alcanzado,
 * la meta definida, el porcentaje que representan y una barra con marcador.
 *
 * El porcentaje se calcula aquí —actual sobre meta— en vez de pedirlo aparte:
 * antes la barra recibía sus valores por defecto y mostraba cifras inventadas.
 */
@Component({
  selector: 'app-cards-medicion-trimestral2',
  standalone: true,
  imports: [CommonModule, ProgressBarDobleComponent],
  templateUrl: './cards-medicion-trimestral2.component.html',
  styleUrl: './cards-medicion-trimestral2.component.css'
})
export class CardsMedicionTrimestral2Component {

  @Input() titulo = "Titulo";
  /** Qué son los valores del bloque; se muestra bajo la cifra grande. */
  @Input() etiquetaValor = "alcanzadas";

  @Input() set subtitulo1(v: string) { this._sub.update(s => [v, s[1], s[2], s[3]]); }
  @Input() set subtitulo2(v: string) { this._sub.update(s => [s[0], v, s[2], s[3]]); }
  @Input() set subtitulo3(v: string) { this._sub.update(s => [s[0], s[1], v, s[3]]); }
  @Input() set subtitulo4(v: string) { this._sub.update(s => [s[0], s[1], s[2], v]); }

  @Input() set valorActual1(v: number | null) { this._actual.update(a => [v, a[1], a[2], a[3]]); }
  @Input() set valorActual2(v: number | null) { this._actual.update(a => [a[0], v, a[2], a[3]]); }
  @Input() set valorActual3(v: number | null) { this._actual.update(a => [a[0], a[1], v, a[3]]); }
  @Input() set valorActual4(v: number | null) { this._actual.update(a => [a[0], a[1], a[2], v]); }

  @Input() set valorMeta1(v: number) { this._meta.update(m => [v, m[1], m[2], m[3]]); }
  @Input() set valorMeta2(v: number) { this._meta.update(m => [m[0], v, m[2], m[3]]); }
  @Input() set valorMeta3(v: number) { this._meta.update(m => [m[0], m[1], v, m[3]]); }
  @Input() set valorMeta4(v: number) { this._meta.update(m => [m[0], m[1], m[2], v]); }

  /** Dónde se planta el marcador de meta en la barra. 100 = alcanzarla del todo. */
  @Input() porcentajeMeta = 100;

  @Input() fondoColor = "bg-white";
  @Input() borderColor = "border-gray-100";
  @Input() textColor = "text-amber-600";
  @Input() colorBarra = "#16a34d";

  private _sub = signal<string[]>(['1 Trimestre', '2 Trimestre', '3 Trimestre', '4 Trimestre']);
  private _actual = signal<(number | null)[]>([0, 0, 0, 0]);
  private _meta = signal<number[]>([0, 0, 0, 0]);

  trimestres = computed<Trimestre[]>(() =>
    this._sub().map((subtitulo, i) => {
      const actual = this._actual()[i];
      const meta = this._meta()[i];
      const porcentaje = (actual === null || actual === undefined || !meta)
        ? null
        : (actual / meta) * 100;

      return { subtitulo, actual, meta, porcentaje, texto: this.formatear(porcentaje) };
    })
  );

  /** Sin decimales sobrantes: 50 → «50%», 62.5 → «62.5%», sin dato → «—». */
  private formatear(valor: number | null): string {
    if (valor === null) return '—';
    return `${Math.round(valor * 100) / 100}%`;
  }

  /** La barra no admite null, así que un trimestre sin medir se dibuja en cero. */
  anchoBarra(porcentaje: number | null): number {
    return porcentaje === null ? 0 : Math.min(100, Math.max(0, porcentaje));
  }

  textoValor(actual: number | null): string {
    return (actual === null || actual === undefined) ? '—' : String(actual);
  }
}
