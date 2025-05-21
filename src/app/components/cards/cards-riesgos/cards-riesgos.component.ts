import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-cards-riesgos',
  standalone: true,
  imports: [],
  templateUrl: './cards-riesgos.component.html',
  styleUrl: './cards-riesgos.component.css'
})
export class CardsRiesgosComponent {

  @Input() nombre = "Nombre de la meta";
  @Input() subnombre = "Unidad de medida";
  @Input() set valorActual(valor: string | number) {
    this._valorActual = typeof valor === 'string' ? parseFloat(valor) : valor;
  }
  get valorActual(): number {
    return this._valorActual;
  }
  private _valorActual: number = 0;

  @Input() set valorMeta(valor: string | number) {
    this._valorMeta = typeof valor === 'string' ? parseFloat(valor) : valor;
  }
  get valorMeta(): number {
    return this._valorMeta;
  }
  private _valorMeta: number = 10;

  @Input() valorColorBarra = "success";
  @Input() color = "#000000";

  get valorActualFormateado(): string {
    return this.valorActual.toString();
  }

}
