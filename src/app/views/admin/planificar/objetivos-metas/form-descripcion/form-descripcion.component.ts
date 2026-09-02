import { CommonModule } from '@angular/common';
import { Component, signal, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

/**
 * Lectura completa de una descripción larga.
 * Las tablas recortan el texto a dos líneas; esto lo muestra entero.
 */
@Component({
  selector: 'app-form-descripcion',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './form-descripcion.component.html',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  styleUrl: './form-descripcion.component.css'
})
export class FormDescripcionComponent {

  mostrarModal = signal<boolean>(false);
  titulo = signal<string>('');
  subtitulo = signal<string>('');
  texto = signal<string>('');

  abrirModal(titulo: string, texto: string, subtitulo = '') {
    this.titulo.set(titulo);
    this.subtitulo.set(subtitulo);
    this.texto.set(texto);
    this.mostrarModal.set(true);
  }

  cerrarModal() {
    this.mostrarModal.set(false);
  }
}
