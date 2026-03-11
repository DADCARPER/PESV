import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ProgramasService {

  constructor() { }

  // Calcular avance
  calcularAvance(valorInicial: number,meta: number,valorReal: number,comportamiento: 'Ascendente' | 'Descendente' = 'Ascendente',ingreso: 'Acumulado' | 'Incremento' = 'Acumulado'): number {
    let avance = 0;
    let acumulado = valorReal;
  
    // Ajustar acumulado según tipo de ingreso
    if (ingreso === 'Incremento') {
      if (comportamiento === 'Ascendente') {
        acumulado = valorInicial + valorReal; // Se suma al inicial
      } else {
        acumulado = valorInicial - valorReal; // Se resta al inicial
      }
    }
  
    // Calcular avance según comportamiento
    if (comportamiento === 'Ascendente') {
      // Ej: meta = 100, inicial = 20, acumulado = 60
      avance = ((acumulado - valorInicial) / (meta - valorInicial)) * 100;
    } else {
      // Descendente → Ej: inicial = 20, meta = 5, acumulado = 17
      avance = ((valorInicial - acumulado) / (valorInicial - meta)) * 100;
    }
  
    // Evitar negativos o NaN
    if (avance < 0 || isNaN(avance)) avance = 0;
  
    // Redondear a 2 decimales solo si los necesita
  return parseFloat(avance.toFixed(2));
  }
  


}
