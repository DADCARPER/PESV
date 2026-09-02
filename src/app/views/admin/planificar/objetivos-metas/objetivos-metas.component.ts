import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, OnDestroy, inject, viewChild, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';

import { FirestoreService } from '../../../../services/shared/firestore.service';
import { AuthenticacionService } from '../../../../services/shared/authenticacion.service';
import { EstatusGeneralService } from '../../../../services/shared/estatus-general.service';
import { AlertaService } from '../../../../services/shared/alerta.service';
import { ObjetivosMetasService } from '../../../../services/shared/objetivos-metas.service';
import { Models } from '../../../../interfaces/models';
import { ModelObjetivosMetas as M } from '../../../../interfaces/objetivosMetas.interface';

import { FormGeneralComponent } from './form-general/form-general.component';
import { FormEspecificoComponent } from './form-especifico/form-especifico.component';
import { FormIndicadorComponent } from './form-indicador/form-indicador.component';
import { FormEliminarComponent } from './form-eliminar/form-eliminar.component';
import { FormDescripcionComponent } from './form-descripcion/form-descripcion.component';

const SLUG = '007-objetivos-metas';

@Component({
  selector: 'app-objetivos-metas',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    FormGeneralComponent, FormEspecificoComponent, FormIndicadorComponent, FormEliminarComponent,
    FormDescripcionComponent,
  ],
  templateUrl: './objetivos-metas.component.html',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  styleUrl: './objetivos-metas.component.css'
})
export class ObjetivosMetasComponent implements OnInit, OnDestroy {

  private _firestore = inject(FirestoreService);
  private _authcations = inject(AuthenticacionService);
  private _estatus = inject(EstatusGeneralService);
  private _alerta = inject(AlertaService);
  public _objetivos = inject(ObjetivosMetasService);

  modalGeneral = viewChild.required<FormGeneralComponent>('modalGeneral');
  modalEspecifico = viewChild.required<FormEspecificoComponent>('modalEspecifico');
  modalIndicador = viewChild.required<FormIndicadorComponent>('modalIndicador');
  modalEliminar = viewChild.required<FormEliminarComponent>('modalEliminar');
  modalDescripcion = viewChild.required<FormDescripcionComponent>('modalDescripcion');

  nombresTrimestres = M.TRIMESTRES;

  generales = signal<M.ConsultarObjetivoGeneral[]>([]);
  especificos = signal<M.ConsultarObjetivoEspecifico[]>([]);
  indicadores = signal<M.ConsultarIndicador[]>([]);
  cargando = signal<boolean>(true);

  /** Ids de objetivos específicos con sus indicadores desplegados. */
  expandidos = signal<Set<string>>(new Set<string>());

  jerarquia = computed(() =>
    this._objetivos.construirJerarquia(this.generales(), this.especificos(), this.indicadores())
  );

  /** Qué hacer si el usuario confirma el borrado abierto. */
  private accionEliminar: (() => Promise<void>) | null = null;

  private subs: Subscription[] = [];

  ngOnInit(): void {
    this.consultar('', this.generales);
    this.consultar('-especificos', this.especificos);
    this.consultar('-indicadores', this.indicadores);
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  private consultar(sufijo: '' | '-especificos' | '-indicadores', destino: { set: (v: any) => void }) {
    const q: Models.Firebases.whereQuery[] = [['estado', '==', 'Activo']];
    const extras: Models.Firebases.extrasQuery = { orderParam: 'docCreado', directionSort: 'asc', limit: 200 };

    this.subs.push(
      this._firestore.getDocumentsQueryChanges<any>(this._objetivos.ruta(sufijo), q, extras).subscribe({
        next: (res) => {
          destino.set(res);
          this.cargando.set(false);
          this.actualizarEstatusGeneral();
        },
        error: (error: unknown) => {
          console.error(`[ObjetivosMetas] consultar${sufijo}:`, error);
          this.cargando.set(false);
        }
      })
    );
  }

  // ── Despliegue ────────────────────────────────────────────────────────────

  alternarExpandido(id: string) {
    const actuales = new Set(this.expandidos());
    actuales.has(id) ? actuales.delete(id) : actuales.add(id);
    this.expandidos.set(actuales);
  }

  estaExpandido(id: string): boolean {
    return this.expandidos().has(id);
  }

  // ── Códigos consecutivos ──────────────────────────────────────────────────

  private consecutivo(prefijo: string, total: number): string {
    return `${prefijo}-${(total + 1).toString().padStart(2, '0')}`;
  }

  // ── Objetivo general ──────────────────────────────────────────────────────

  crearGeneral() {
    this.modalGeneral().abrirModal('crear', undefined, this.consecutivo('OG', this.generales().length));
  }

  editarGeneral(dato: M.ConsultarObjetivoGeneral) {
    this.modalGeneral().abrirModal('editar', dato);
  }

  eliminarGeneral(avance: M.AvanceGeneral) {
    const hijos = avance.especificos.length;
    this.accionEliminar = async () => {
      await this.marcarInactivo(this._objetivos.ruta(), avance.general.id);
      for (const e of avance.especificos) {
        await this.marcarInactivo(this._objetivos.ruta('-especificos'), e.especifico.id);
        for (const i of e.indicadores) {
          await this.marcarInactivo(this._objetivos.ruta('-indicadores'), i.id);
        }
      }
      this._alerta.showSuccess('Objetivo general eliminado exitosamente.');
    };

    this.modalEliminar().abrirModal({
      titulo: 'Eliminar objetivo general',
      detalle: `${avance.general.codigo} — ${this.resumen(avance.general.descripcion)}`,
      advertencia: hijos > 0
        ? `Se eliminarán también sus ${hijos} objetivo(s) específico(s) y todos sus indicadores.`
        : '',
    });
  }

  // ── Objetivo específico ───────────────────────────────────────────────────

  crearEspecifico(avance: M.AvanceGeneral) {
    this.modalEspecifico().abrirModal(
      'crear', avance.general.id, `${avance.general.codigo} — ${this.resumen(avance.general.descripcion, 80)}`,
      undefined, this.consecutivo('OE', this.especificos().length)
    );
  }

  editarEspecifico(dato: M.ConsultarObjetivoEspecifico, contexto: string) {
    this.modalEspecifico().abrirModal('editar', dato.objetivoGeneralId, contexto, dato);
  }

  eliminarEspecifico(avance: M.AvanceEspecifico) {
    this.accionEliminar = async () => {
      await this.marcarInactivo(this._objetivos.ruta('-especificos'), avance.especifico.id);
      for (const i of avance.indicadores) {
        await this.marcarInactivo(this._objetivos.ruta('-indicadores'), i.id);
      }
      this._alerta.showSuccess('Objetivo específico eliminado exitosamente.');
    };

    this.modalEliminar().abrirModal({
      titulo: 'Eliminar objetivo específico',
      detalle: `${avance.especifico.codigo} — ${this.resumen(avance.especifico.descripcion)}`,
      advertencia: avance.indicadores.length > 0
        ? `Se eliminarán también sus ${avance.indicadores.length} indicador(es).`
        : '',
    });
  }

  // ── Indicador ─────────────────────────────────────────────────────────────

  crearIndicador(avance: M.AvanceEspecifico) {
    this.modalIndicador().abrirModal(
      'crear', avance.especifico.id, `${avance.especifico.codigo} — ${this.resumen(avance.especifico.descripcion, 80)}`,
      undefined, this.consecutivo('IND', this.indicadores().length)
    );
  }

  editarIndicador(dato: M.ConsultarIndicador, contexto: string) {
    this.modalIndicador().abrirModal('editar', dato.objetivoEspecificoId, contexto, dato);
  }

  eliminarIndicador(dato: M.ConsultarIndicador) {
    this.accionEliminar = async () => {
      await this.marcarInactivo(this._objetivos.ruta('-indicadores'), dato.id);
      this._alerta.showSuccess('Indicador eliminado exitosamente.');
    };

    this.modalEliminar().abrirModal({
      titulo: 'Eliminar indicador',
      detalle: `${dato.codigo} — ${this.resumen(dato.nombre)}`,
    });
  }

  async confirmarEliminacion() {
    if (!this.accionEliminar) return;
    try {
      await this.accionEliminar();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error al eliminar';
      console.error('[ObjetivosMetas] eliminar:', error);
      this._alerta.showError(msg);
    } finally {
      this.accionEliminar = null;
    }
  }

  private marcarInactivo(coleccion: string, id: string): Promise<void> {
    return this._firestore.updateDocument(`${coleccion}/${id}`, { estado: 'NoActivo' });
  }

  // ── Presentación ──────────────────────────────────────────────────────────

  /** Recorta un texto largo para usarlo como contexto o confirmación. */
  private resumen(texto: string, max = 120): string {
    if (!texto) return '';
    return texto.length > max ? texto.slice(0, max).trimEnd() + '…' : texto;
  }

  /** Etiqueta de contexto para los modales, con la descripción ya recortada. */
  contextoDe(codigo: string, descripcion: string): string {
    return `${codigo} — ${this.resumen(descripcion, 80)}`;
  }

  /** Abre la lectura completa de una descripción recortada en la tabla. */
  verDescripcion(titulo: string, texto: string, subtitulo = '') {
    this.modalDescripcion().abrirModal(titulo, texto, subtitulo);
  }

  /** Cumplimiento del general en porcentaje, con decimales solo si los hay. */
  textoCumplimiento(valor: number | null): string {
    return valor === null ? '—' : this._objetivos.formatear(valor * 100, '%');
  }

  textoAvance(valor: number | null): string {
    return this._objetivos.formatear(valor, '%');
  }

  /** Valor de un trimestre con su unidad: «50%», «50.25%», «3 Días». */
  valorIndicador(indicador: M.ConsultarIndicador, trimestre: number): string {
    return this._objetivos.formatear(indicador.trimestres?.[trimestre], indicador.unidad);
  }

  /** Promedio anual del indicador, ya formateado. */
  valorAnualIndicador(indicador: M.ConsultarIndicador): string {
    return this._objetivos.formatear(this._objetivos.valorAnualIndicador(indicador), indicador.unidad);
  }

  estadoAnualIndicador(indicador: M.ConsultarIndicador): M.EstadoIndicador {
    return this._objetivos.estadoAnualIndicador(indicador);
  }

  claseAnualIndicador(indicador: M.ConsultarIndicador): string {
    return this._objetivos.claseEstadoIndicador(this.estadoAnualIndicador(indicador));
  }

  /** Meta con su símbolo de dirección y su unidad. */
  metaIndicador(indicador: M.ConsultarIndicador): string {
    const simbolo = indicador.direccion === 'menorIgual' ? '≤' : '≥';
    return `${simbolo} ${this._objetivos.formatear(indicador.meta, indicador.unidad)}`;
  }

  /** El $index de la plantilla llega como number; aquí se estrecha a Trimestre. */
  estadoIndicador(indicador: M.ConsultarIndicador, trimestre: number): M.EstadoIndicador {
    return this._objetivos.estadoIndicador(indicador, trimestre as M.Trimestre);
  }

  claseIndicador(indicador: M.ConsultarIndicador, trimestre: number): string {
    return this._objetivos.claseEstadoIndicador(this.estadoIndicador(indicador, trimestre));
  }

  // ── Progreso del módulo ───────────────────────────────────────────────────

  /**
   * La tarjeta del dashboard mide si la estructura del módulo está definida,
   * no si los objetivos se cumplen: el cumplimiento vive dentro del módulo.
   *
   *    0%   nada creado
   *   30%   hay objetivo general
   *   60%   además hay objetivo específico
   *  100%   además hay al menos un indicador
   */
  private async actualizarEstatusGeneral(): Promise<void> {
    const hayGeneral = this.generales().length > 0;
    const hayEspecifico = this.especificos().length > 0;
    const hayIndicador = this.indicadores().length > 0;

    let progreso = 0;
    if (hayGeneral) progreso = 30;
    if (hayGeneral && hayEspecifico) progreso = 60;
    if (hayGeneral && hayEspecifico && hayIndicador) progreso = 100;

    const alcanzados = this.jerarquia()
      .flatMap(g => g.especificos)
      .filter(e => this._objetivos.estadoEspecifico(e.avanceAnual, e.especifico.meta) === 'ALCANZADO')
      .length;

    const modulo: Models.Procesos.Modulo007ObjetivosMetas = {
      total_progreso: progreso,
      objetivosDefinidos: { total: this.generales().length },
      objetivosCompletos: { total: alcanzados },
      metasDefinidas: { total: this.indicadores().length },
    };

    await this._estatus.registrarProgreso(SLUG, modulo);
  }
}
