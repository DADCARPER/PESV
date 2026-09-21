import { Component, CUSTOM_ELEMENTS_SCHEMA, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { InformeDiagnosticoService } from '../../../../../services/shared/informe-diagnostico.service';
import { AuthenticacionService } from '../../../../../services/shared/authenticacion.service';
import { AlertaService } from '../../../../../services/shared/alerta.service';
import { ModelsInforme } from '../../../../../interfaces/informe.interface';

/**
 * Informe de diagnóstico: vista previa de las cifras.
 *
 * Esta pantalla reemplaza a la anterior, que componía tres subpantallas con
 * los números escritos a mano y generaba el PDF fotografiando el DOM con
 * html2canvas. Salía bonito con datos inventados.
 *
 * Por ahora solo muestra lo que el sistema ve, que es lo que permite descubrir
 * qué falta antes de montar el asistente de emisión y el PDF.
 */
@Component({
  selector: 'app-informe-diagnostico',
  standalone: true,
  imports: [CommonModule, RouterLink],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './informe-diagnostico.component.html',
})
export class InformeDiagnosticoComponent {

  private _informe = inject(InformeDiagnosticoService);
  private _auth = inject(AuthenticacionService);
  private _alerta = inject(AlertaService);

  readonly periodo = this._auth.periodo;

  cargando = signal(true);
  datos = signal<ModelsInforme.Datos | null>(null);

  constructor() {
    effect(() => {
      this.periodo();
      this.cargar();
    }, { allowSignalWrites: true });
  }

  async cargar() {
    this.cargando.set(true);
    try {
      this.datos.set(await this._informe.reunir());
    } catch (error: unknown) {
      console.error('[InformeDiagnostico] reunir:', error);
      this._alerta.showError('No se pudieron reunir las cifras del informe.');
      this.datos.set(null);
    } finally {
      this.cargando.set(false);
    }
  }

  /** Secciones sin ningún dato: lo que habría que llenar antes de emitir. */
  seccionesVacias(): string[] {
    return (this.datos()?.secciones ?? [])
      .filter(s => s.sinDatos)
      .map(s => s.titulo);
  }

  /** Cifras marcadas como alerta en todo el informe, para verlas juntas. */
  alertas(): { seccion: string; cifra: ModelsInforme.Cifra }[] {
    return (this.datos()?.secciones ?? []).flatMap(s =>
      s.cifras.filter(c => c.alerta).map(cifra => ({ seccion: s.titulo, cifra }))
    );
  }
}
