import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, inject, viewChild, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TablaCompartidaComponent } from "../../../../../components/tablas/tabla-compartida/tabla-compartida.component";
import { TablaLeftComponent } from "../../../../../components/tablas/tabla-left/tabla-left.component";
import { CardsMetasResultadosComponent } from "../../../../../components/cards/cards-metas-resultados/cards-metas-resultados.component";
import { CardsMedicionTrimestralComponent } from "../../../../../components/cards/cards-medicion-trimestral/cards-medicion-trimestral.component";
import { CardsMedicionAnualComponent } from "../../../../../components/cards/cards-medicion-anual/cards-medicion-anual.component";
import { Formulario1Component } from './formulario1/formulario1.component';
import { Formulario2Component } from "./formulario2/formulario2.component";
import { Formulario3Component } from "./formulario3/formulario3.component";
import { IndicadoresService } from '../../../../../services/shared/indicadores.service';
import { ModelIndicadores } from '../../../../../interfaces/indicadores.interface';

type Nivel = ModelIndicadores.NivelPerdida;

@Component({
  selector: 'app-indicador1',
  standalone: true,
  imports: [
    CommonModule, TablaCompartidaComponent, TablaLeftComponent,
    CardsMetasResultadosComponent, CardsMedicionTrimestralComponent, CardsMedicionAnualComponent,
    Formulario1Component, Formulario2Component, Formulario3Component
  ],
  templateUrl: './indicador1.component.html',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  styleUrl: './indicador1.component.css'
})
export class Indicador1Component implements OnInit {

  private _indicadores = inject(IndicadoresService);

  modalFormulario = viewChild.required<Formulario1Component>('modalFormulario');
  modalFormulario2 = viewChild.required<Formulario2Component>('modalFormulario2');
  modalFormulario3 = viewChild.required<Formulario3Component>('modalFormulario3');

  /** Cabeceras de las tablas mensuales. */
  datos = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE", "TOTAL", "UNIDAD"];

  niveles = ModelIndicadores.NIVELES_PERDIDA;
  nombresNiveles = ModelIndicadores.NIVELES_PERDIDA.map((n, i) => `${i + 1}. ${n.nombre}`);

  tsv = signal<ModelIndicadores.IndicadorTSV>(ModelIndicadores.indicadorTSVVacio());
  cargando = signal<boolean>(true);

  trimestres = computed(() => this._indicadores.calcularTrimestres(this.tsv()));
  anual = computed(() => this._indicadores.calcularAnual(this.tsv()));

  /** Fila de la tabla de kilómetros: doce meses + total + unidad. */
  filaKilometraje = computed(() => {
    const km = this.tsv().kilometraje;
    const total = km.reduce((acc, v) => acc + (v || 0), 0);
    return [...km.map(v => (v || 0).toLocaleString('es-CO')), total.toLocaleString('es-CO'), 'km'];
  });

  /** Una fila por nivel de pérdida con los siniestros de cada mes. */
  filasSiniestros = computed(() =>
    this.niveles.map(({ clave }) => {
      const meses = this.tsv().siniestros.map(m => m?.[clave] ?? 0);
      const total = meses.reduce((acc, v) => acc + v, 0);
      return [...meses.map(String), String(total), 'siniestros'];
    })
  );

  /** Una fila por nivel con el TSV de cada trimestre, repetido en sus tres meses. */
  filasResultados = computed(() => {
    const trimestres = this.trimestres();
    return this.niveles.map(({ clave }) => {
      const celdas: string[] = [];
      ModelIndicadores.TRIMESTRES.forEach((t, indice) => {
        const valor = trimestres[indice].tsv[clave];
        const texto = valor === null ? '—' : valor.toFixed(2);
        t.meses.forEach(() => celdas.push(texto));
      });
      const anual = this.anual()[clave];
      celdas.push(anual === null ? '—' : anual.toFixed(2));
      celdas.push('/ M km');
      return celdas;
    });
  });

  ngOnInit(): void {
    this.cargar();
  }

  async cargar() {
    this.cargando.set(true);
    this.tsv.set(await this._indicadores.getTSV());
    this.cargando.set(false);
  }

  /** Muestra el TSV anual de un nivel, o un guion si aún no hay kilómetros. */
  valorAnual(clave: Nivel): string {
    const valor = this.anual()[clave];
    return valor === null ? '—' : valor.toFixed(2);
  }

  metaDe(clave: Nivel): string {
    return (this.tsv().metas[clave] ?? 0).toFixed(2);
  }

  cumplimientoDe(clave: Nivel): number {
    return this._indicadores.cumplimiento(this.anual()[clave], this.tsv().metas[clave] ?? 0);
  }

  /** Valor de un trimestre para las tarjetas de medición; suma los cuatro niveles. */
  tsvTrimestre(indice: number): string {
    const t = this.trimestres()[indice];
    if (t.kilometros === 0) return '0.0';
    const total = this.niveles.reduce((acc, n) => acc + (t.tsv[n.clave] ?? 0), 0);
    return total.toFixed(2);
  }

  metaGeneral(): string {
    const suma = this.niveles.reduce((acc, n) => acc + (this.tsv().metas[n.clave] ?? 0), 0);
    return suma.toFixed(2);
  }

  /** TSV general del año: todos los siniestros sobre todos los kilómetros. */
  tsvAnualGeneral(): string {
    const total = this.niveles.reduce((acc, n) => acc + (this.anual()[n.clave] ?? 0), 0);
    return total.toFixed(2);
  }

  porcentajeAnual(): number {
    const meta = Number(this.metaGeneral());
    const valor = Number(this.tsvAnualGeneral());
    if (valor === 0) return 100;
    if (meta === 0) return 0;
    return Math.min(100, Math.max(0, Math.round((meta / valor) * 100)));
  }

  mostrarModalFormulario(): void {
    this.modalFormulario().abrirModal(this.tsv().kilometraje);
  }

  mostrarModalFormulario2(): void {
    this.modalFormulario2().abrirModal(this.tsv().metas);
  }

  mostrarModalFormulario3(): void {
    this.modalFormulario3().abrirModal(this.tsv().siniestros);
  }
}
