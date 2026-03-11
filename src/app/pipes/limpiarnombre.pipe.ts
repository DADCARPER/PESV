import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'limpiarnombre',
  standalone: true
})
export class LimpiarnombrePipe implements PipeTransform {

  transform(value: string): string {
    if (!value) return '';
    // Quita números al inicio seguidos de un guion bajo
    return value.replace(/^\d+_/, '');
  }

}
