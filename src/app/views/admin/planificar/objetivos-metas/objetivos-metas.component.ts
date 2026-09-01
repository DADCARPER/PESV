import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, OnDestroy, inject, viewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';

import { FirestoreService } from '../../../../services/shared/firestore.service';
import { AuthenticacionService } from '../../../../services/shared/authenticacion.service';
import { EstatusGeneralService } from '../../../../services/shared/estatus-general.service';
import { Models } from '../../../../interfaces/models';

import { Form1ObjetivosMetasComponent } from './form1-objetivos-metas/form1-objetivos-metas.component';
import { Form2ObjetivosMetasComponent } from './form2-objetivos-metas/form2-objetivos-metas.component';

@Component({
  selector: 'app-objetivos-metas',
  standalone: true,
  imports: [CommonModule, RouterLink, Form1ObjetivosMetasComponent, Form2ObjetivosMetasComponent],
  templateUrl: './objetivos-metas.component.html',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  styleUrl: './objetivos-metas.component.css'
})
export class ObjetivosMetasComponent implements OnInit, OnDestroy {

  private _firestore = inject(FirestoreService);
  private _authcations = inject(AuthenticacionService);
  private _estatus = inject(EstatusGeneralService);

  modalFormulario = viewChild.required<Form1ObjetivosMetasComponent>('modalFormulario');
  modalEliminar = viewChild.required<Form2ObjetivosMetasComponent>('modalEliminar');

  objetivos = signal<Models.ObjetivosMetas.ConsultarObjetivo[]>([]);
  cargando = signal<boolean>(true);
  expandidos = signal<Set<string>>(new Set<string>());

  private _subObjetivos?: Subscription;
  private nit: string | null = null;

  ngOnInit(): void {
    this.nit = this._authcations.getCurrentUser()?.displayName ?? null;
    this.consultarObjetivos();
  }

  ngOnDestroy(): void {
    this._subObjetivos?.unsubscribe();
  }

  consultarObjetivos() {
    const periodo = this._authcations.periodo();
    const path = `Empresas/${this.nit}/periodos/${periodo}/007-objetivos-metas`;
    const q: Models.Firebases.whereQuery[] = [['estado', '==', 'Activo']];
    const extras: Models.Firebases.extrasQuery = { orderParam: 'docCreado', directionSort: 'asc', limit: 50 };

    this._subObjetivos = this._firestore
      .getDocumentsQueryChanges<Models.ObjetivosMetas.ConsultarObjetivo>(path, q, extras)
      .subscribe({
        next: (res) => {
          this.objetivos.set(res);
          this.cargando.set(false);
          this.actualizarEstatusGeneral();
        },
        error: (error: unknown) => {
          console.error('[ObjetivosMetas] consultarObjetivos:', error);
          this.cargando.set(false);
        }
      });
  }

  /** Calcula el siguiente código consecutivo: OBJ-01, OBJ-02... */
  siguienteCodigo(): string {
    const consecutivo = this.objetivos().length + 1;
    return `OBJ-${consecutivo.toString().padStart(2, '0')}`;
  }

  mostrarModalFormulario(modo: 'crear' | 'editar', datoaEditar?: Models.ObjetivosMetas.ConsultarObjetivo): void {
    this.modalFormulario().abrirModal(modo, datoaEditar, this.siguienteCodigo());
  }

  manejarEdicion(objetivo: Models.ObjetivosMetas.ConsultarObjetivo) {
    this.mostrarModalFormulario('editar', objetivo);
  }

  manejarEliminar(objetivo: Models.ObjetivosMetas.ConsultarObjetivo) {
    this.modalEliminar().abrirModal(objetivo);
  }

  /**
   * Un objetivo está completo cuando es medible: tiene descripción, responsable,
   * plazos y al menos una meta con indicador y valor definidos.
   */
  private esObjetivoCompleto(obj: Models.ObjetivosMetas.ConsultarObjetivo): boolean {
    const datosBase = !!obj.descripcion?.trim()
      && !!obj.responsable?.trim()
      && !!obj.fechaInicio
      && !!obj.fechaFin;

    const metasMedibles = (obj.metas?.length ?? 0) > 0
      && obj.metas.every(m => !!m.indicador?.trim() && m.valorMeta !== null && m.valorMeta !== undefined);

    return datosBase && metasMedibles;
  }

  private async actualizarEstatusGeneral(): Promise<void> {
    const objetivos = this.objetivos();
    const completos = objetivos.filter(obj => this.esObjetivoCompleto(obj)).length;

    const modulo: Models.Procesos.Modulo007ObjetivosMetas = {
      total_progreso: objetivos.length > 0 ? Math.round((completos / objetivos.length) * 100) : 0,
      objetivosDefinidos: { total: objetivos.length },
      objetivosCompletos: { total: completos },
      metasDefinidas: { total: this.totalMetas() },
    };

    await this._estatus.registrarProgreso('007-objetivos-metas', modulo);
  }

  /** Abre o cierra el detalle de metas de un objetivo. */
  alternarExpandido(id: string) {
    const actuales = new Set(this.expandidos());
    if (actuales.has(id)) {
      actuales.delete(id);
    } else {
      actuales.add(id);
    }
    this.expandidos.set(actuales);
  }

  estaExpandido(id: string): boolean {
    return this.expandidos().has(id);
  }

  /** Total de metas de todos los objetivos, para la cabecera. */
  totalMetas(): number {
    return this.objetivos().reduce((acc, obj) => acc + (obj.metas?.length ?? 0), 0);
  }

}
