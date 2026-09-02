import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ProgressBarDobleComponent } from "../../otros/progress-bar-doble/progress-bar-doble.component";

/**
 * Resultado anual de un indicador: lo alcanzado frente a lo definido, con su
 * porcentaje y la barra de avance.
 *
 * El porcentaje se calcula aquí a partir de las dos cifras, en vez de pedirlo
 * aparte: antes la barra se invocaba sin valores y mostraba sus defaults.
 */
@Component({
  selector: 'app-cards-medicion-anual2',
  standalone: true,
  imports: [CommonModule, ProgressBarDobleComponent],
  templateUrl: './cards-medicion-anual2.component.html',
  styleUrl: './cards-medicion-anual2.component.css'
})
export class CardsMedicionAnual2Component {

  @Input() titulo = "Medición Anual";
  /** Qué son los valores; se muestra junto a la cifra grande. */
  @Input() etiquetaValor = "alcanzadas";
  @Input() fondoColor = "";
  @Input() borderColor = "";
  @Input() textColor = "text-amber-600";
  @Input() colorBarra = "#16a34d";
  @Input() ano_actual = "";
  @Input() valorActual = "0";
  @Input() valorMeta = "0";
  /** Dónde se planta la marca de meta en la barra. 100 = alcanzarla del todo. */
  @Input() porcentajeMeta = 100;

  /** Lo alcanzado sobre lo definido; null cuando no hay meta contra la que medir. */
  get porcentaje(): number | null {
    const actual = Number(this.valorActual);
    const meta = Number(this.valorMeta);
    if (!meta || Number.isNaN(actual) || Number.isNaN(meta)) return null;
    return (actual / meta) * 100;
  }

  /** Sin decimales sobrantes: 50 → «50%», 62.5 → «62.5%», sin dato → «—». */
  get textoPorcentaje(): string {
    const p = this.porcentaje;
    return p === null ? '—' : `${Math.round(p * 100) / 100}%`;
  }

  /** La barra no admite null ni valores fuera de rango. */
  get anchoBarra(): number {
    const p = this.porcentaje;
    return p === null ? 0 : Math.min(100, Math.max(0, p));
  }
}
