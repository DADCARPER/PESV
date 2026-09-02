import { CommonModule } from '@angular/common';
import { Component, signal, output } from '@angular/core';

/**
 * Confirmación de borrado, reutilizada en los tres niveles de la jerarquía.
 * Solo pregunta: el borrado lo ejecuta el componente padre, que es quien sabe
 * qué hay que arrastrar en cascada.
 */
@Component({
  selector: 'app-form-eliminar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './form-eliminar.component.html',
  styleUrl: './form-eliminar.component.css'
})
export class FormEliminarComponent {

  confirmado = output<void>();

  mostrarModal = signal<boolean>(false);
  titulo = signal<string>('Eliminar');
  detalle = signal<string>('');
  advertencia = signal<string>('');

  abrirModal(config: { titulo: string; detalle: string; advertencia?: string }) {
    this.titulo.set(config.titulo);
    this.detalle.set(config.detalle);
    this.advertencia.set(config.advertencia ?? '');
    this.mostrarModal.set(true);
  }

  cerrarModal() {
    this.mostrarModal.set(false);
  }

  handleSave() {
    this.confirmado.emit();
    this.cerrarModal();
  }

  handleCancel() {
    this.cerrarModal();
  }
}
