import { Injectable, signal, computed } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SignalsService {

  constructor() { }

  // Signal principal para la URL del logo
  public logoUrlSignal = signal<string>('');
  
  // Signal computado que verifica si hay un logo
  hasLogo = computed(() => !!this.logoUrlSignal());
  
  // Getter para obtener el valor actual
  get logoUrl() {
    return this.logoUrlSignal();
  }

  // Método para actualizar la URL
  setLogoUrl(url: string) {
    this.logoUrlSignal.set(url);
  }

  // Método para limpiar la URL
  clearLogo() {
    this.logoUrlSignal.set('');
  }
}
