import { CommonModule } from '@angular/common';
import { Component, signal, inject, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IndicadoresService } from '../../../../../../services/shared/indicadores.service';
import { ModelIndicadores } from '../../../../../../interfaces/indicadores.interface';

/**
 * Siniestros por mes y nivel de pérdida — el numerador SV(tn).
 *
 * La fuente oficial es el registro interno de siniestros (pasos 12 y 13). Hasta
 * que ese módulo exista, se captura aquí con la misma estructura que tendrá,
 * para que después sea cambiar el origen y no migrar los datos.
 */
@Component({
  selector: 'app-formulario3',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './formulario3.component.html',
  styleUrl: './formulario3.component.css'
})
export class Formulario3Component {

  private _indicadores = inject(IndicadoresService);

  guardado = output<void>();

  mostrarModal = signal<boolean>(false);
  guardando = signal<boolean>(false);

  meses = ModelIndicadores.MESES;
  niveles = ModelIndicadores.NIVELES_PERDIDA;
  siniestros: ModelIndicadores.SiniestrosMes[] = [];

  constructor() {
    this.siniestros = Array.from({ length: 12 }, () => ModelIndicadores.siniestrosVacios());
  }

  totalNivel(clave: ModelIndicadores.NivelPerdida): number {
    return this.siniestros.reduce((acc, mes) => acc + (Number(mes[clave]) || 0), 0);
  }

  totalMes(indice: number): number {
    return this.niveles.reduce((acc, n) => acc + (Number(this.siniestros[indice][n.clave]) || 0), 0);
  }

  abrirModal(siniestrosActuales?: ModelIndicadores.SiniestrosMes[]) {
    this.siniestros = siniestrosActuales
      ? siniestrosActuales.map(m => ({ ...m }))
      : Array.from({ length: 12 }, () => ModelIndicadores.siniestrosVacios());
    this.mostrarModal.set(true);
  }

  cerrarModal() {
    this.mostrarModal.set(false);
  }

  async handleSave() {
    this.guardando.set(true);
    const limpio = this.siniestros.map(mes => {
      const fila = ModelIndicadores.siniestrosVacios();
      for (const { clave } of this.niveles) {
        fila[clave] = Math.max(0, Number(mes[clave]) || 0);
      }
      return fila;
    });

    const ok = await this._indicadores.guardarTSV({ siniestros: limpio }, 'Siniestros guardados exitosamente.');
    this.guardando.set(false);

    if (ok) {
      this.guardado.emit();
      this.cerrarModal();
    }
  }

  handleCancel() {
    this.cerrarModal();
  }
}
