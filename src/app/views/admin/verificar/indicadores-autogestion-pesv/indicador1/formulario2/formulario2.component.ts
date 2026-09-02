import { CommonModule } from '@angular/common';
import { Component, signal, inject, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IndicadoresService } from '../../../../../../services/shared/indicadores.service';
import { ModelIndicadores } from '../../../../../../interfaces/indicadores.interface';

/**
 * Metas de TSV para cada nivel de pérdida.
 * La meta se expresa en la misma unidad del indicador: siniestros por millón
 * de kilómetros recorridos.
 */
@Component({
  selector: 'app-formulario2',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './formulario2.component.html',
  styleUrl: './formulario2.component.css'
})
export class Formulario2Component {

  private _indicadores = inject(IndicadoresService);

  guardado = output<void>();

  mostrarModal = signal<boolean>(false);
  guardando = signal<boolean>(false);

  niveles = ModelIndicadores.NIVELES_PERDIDA;
  metas: Record<ModelIndicadores.NivelPerdida, number> = {
    fatales: 0, heridosGraves: 0, heridosLeves: 0, choquesSimples: 0,
  };

  abrirModal(metasActuales?: Record<ModelIndicadores.NivelPerdida, number>) {
    this.metas = metasActuales
      ? { ...metasActuales }
      : { fatales: 0, heridosGraves: 0, heridosLeves: 0, choquesSimples: 0 };
    this.mostrarModal.set(true);
  }

  cerrarModal() {
    this.mostrarModal.set(false);
  }

  async handleSave() {
    this.guardando.set(true);
    const limpias = { ...this.metas };
    for (const { clave } of this.niveles) {
      limpias[clave] = Math.max(0, Number(limpias[clave]) || 0);
    }

    const ok = await this._indicadores.guardarTSV({ metas: limpias }, 'Metas guardadas exitosamente.');
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
