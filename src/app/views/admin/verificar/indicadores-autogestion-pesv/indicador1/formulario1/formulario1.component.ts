import { CommonModule } from '@angular/common';
import { Component, signal, inject, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IndicadoresService } from '../../../../../../services/shared/indicadores.service';
import { ModelIndicadores } from '../../../../../../interfaces/indicadores.interface';

/**
 * Captura de kilómetros recorridos por toda la flota, mes a mes.
 * Alimenta el denominador km(t) del indicador 1.
 */
@Component({
  selector: 'app-formulario1',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './formulario1.component.html',
  styleUrl: './formulario1.component.css'
})
export class Formulario1Component {

  private _indicadores = inject(IndicadoresService);

  guardado = output<void>();

  mostrarModal = signal<boolean>(false);
  guardando = signal<boolean>(false);

  meses = ModelIndicadores.MESES;
  kilometraje: number[] = Array(12).fill(0);

  get total(): number {
    return this.kilometraje.reduce((acc, km) => acc + (Number(km) || 0), 0);
  }

  abrirModal(kilometrajeActual?: number[]) {
    this.kilometraje = kilometrajeActual ? [...kilometrajeActual] : Array(12).fill(0);
    this.mostrarModal.set(true);
  }

  cerrarModal() {
    this.mostrarModal.set(false);
  }

  async handleSave() {
    this.guardando.set(true);
    const limpio = this.kilometraje.map(km => Math.max(0, Number(km) || 0));
    const ok = await this._indicadores.guardarTSV({ kilometraje: limpio }, 'Kilometraje guardado exitosamente.');
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
