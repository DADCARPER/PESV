import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'fechafirestore',
  standalone: true
})
export class FechafirestorePipe implements PipeTransform {

  transform(timestamp: any): string {
    if (!timestamp || !timestamp.seconds) return '';

    const fecha = new Date(timestamp.seconds * 1000);
    const dia = fecha.getDate().toString().padStart(2, '0');
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const año = fecha.getFullYear();

    let hora = fecha.getHours();
    const min = fecha.getMinutes().toString().padStart(2, '0');
    const ampm = hora >= 12 ? 'PM' : 'AM';
    hora = hora % 12;
    hora = hora ? hora : 12; // El '0' se muestra como '12'
    const horaStr = hora.toString().padStart(2, '0');

    return `${dia}/${mes}/${año} - ${horaStr}:${min} ${ampm}`;
  }

}

@Pipe({
  name: 'fechaMesAno',
  standalone: true
})
export class FechaMesAnoPipe implements PipeTransform {

  transform(timestamp: any): string {
    if (!timestamp || !timestamp.seconds) return '';

    const fecha = new Date(timestamp.seconds * 1000);
    const meses = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    
    const mes = meses[fecha.getMonth()];
    const año = fecha.getFullYear();

    return `${mes}, ${año}`;
  }

}

@Pipe({
  name: 'fechaDiaMesAno',
  standalone: true
})
export class FechaDiaMesAnoPipe implements PipeTransform {

  private readonly meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  transform(input: any, mesAno: boolean = false): string {
    if (input == null) return '';

    // Permitimos string 'YYYY/MM/DD' o 'YYYY-MM-DD'
    if (typeof input === 'string') {
      const m = input.match(/^(\d{4})[\/-](\d{2})[\/-](\d{2})$/);
      if (m) {
        const year = parseInt(m[1], 10);
        const monthIdx = parseInt(m[2], 10) - 1; // 0..11
        const day = parseInt(m[3], 10);
        const nombreMes = this.meses[monthIdx];
        if (!nombreMes) return '';
        const salida = mesAno ? `${nombreMes} del ${year}` : `${day} de ${nombreMes} del ${year}`;
        return salida;
      }
      return '';
    }

    let date: Date | null = null;

    // Timestamp de Firestore
    if (typeof input === 'object') {
      if (input && typeof (input as any).toDate === 'function') {
        date = (input as any).toDate();
      } else if (input && 'seconds' in (input as any)) {
        date = new Date((input as any).seconds * 1000);
      }
    }

    // Date
    if (!date && input instanceof Date) {
      date = input;
    }

    // number (ms)
    if (!date && typeof input === 'number') {
      date = new Date(input);
    }

    if (!date || isNaN(date.getTime())) return '';

    const day = date.getDate();
    const nombreMes = this.meses[date.getMonth()];
    const year = date.getFullYear();

    if(mesAno){
      return `${nombreMes} del ${year}`;
    }else{
      return `${day} de ${nombreMes} del ${year}`;
    }
  }
}