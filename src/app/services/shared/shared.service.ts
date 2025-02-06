import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SharedService {

  // Signal contador para controlar actualizaciones
  private updateCounter = signal(0);

  // Método que llama el componente que sube archivos
  notificarNuevaSubida() {
    // Incrementamos el contador para triggerear la actualización
    this.updateCounter.update(count => count + 1);
  }

  // Método que usa el componente de la tabla
  getActualizarTabla() {
    return this.updateCounter;
  }

}
