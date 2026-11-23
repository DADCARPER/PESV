import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BarrasInformeComponent } from '../../../../../components/apexChart/barras-informe/barras-informe.component';
import { PieMonochromeComponent } from '../../../../../components/apexChart/pie-monochrome/pie-monochrome.component';
import { DonutComponent } from '../../../../../components/apexChart/donut/donut.component';

import { InformeDiagnosticoService } from '../../../../../services/shared/informe-diagnostico.service';
import { InformePdfService } from '../../../../../services/shared/informe-pdf.service';
import { AuthenticacionService } from '../../../../../services/shared/authenticacion.service';
import { AlertaService } from '../../../../../services/shared/alerta.service';
import { ModelsInforme } from '../../../../../interfaces/informe.interface';

/**
 * Informe de diagnóstico: vista previa, asistente de emisión e historial.
 *
 * Esta pantalla reemplaza a la anterior, que componía tres subpantallas con
 * los números escritos a mano y generaba el PDF fotografiando el DOM con
 * html2canvas. Salía bonito con datos inventados.
 *
 * La vista previa es un borrador vivo: se recalcula con cada visita y refleja
 * el diagnóstico tal como está hoy. Emitir es lo contrario: congela una copia
 * de las cifras para poder presentarla y para poder reproducirla dentro de un
 * año. El diagnóstico sigue abierto después de emitir; lo que queda quieto es
 * el informe.
 */
@Component({
  selector: 'app-informe-diagnostico',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, BarrasInformeComponent, PieMonochromeComponent, DonutComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './informe-diagnostico.component.html',
})
export class InformeDiagnosticoComponent {

  private _informe = inject(InformeDiagnosticoService);
  private _auth = inject(AuthenticacionService);
  private _alerta = inject(AlertaService);
  private _pdf = inject(InformePdfService);

  readonly periodo = this._auth.periodo;

  cargando = signal(true);
  datos = signal<ModelsInforme.Datos | null>(null);

  // ── Historial ─────────────────────────────────────────────────────────────

  historial = signal<ModelsInforme.Informe[]>([]);

  vigente = computed(() => this.historial().find(i => i.vigencia === 'vigente') ?? null);
  archivados = computed(() => this.historial().filter(i => i.vigencia !== 'vigente'));

  // ── Asistente ─────────────────────────────────────────────────────────────

  asistente = signal(false);
  paso = signal(0);
  emitiendo = signal(false);

  /** Qué informe se está armando ahora mismo, para no pulsar dos veces. */
  descargando = signal<string | null>(null);

  /**
   * Los pasos del asistente: el aviso, una sección por sección y el cierre.
   *
   * No se agrupan varias secciones en un paso aunque salgan muchos. El punto
   * del asistente es que quien emite pase por delante de cada cosa que el
   * sistema escribió y decida si la deja; juntar cuatro secciones en una
   * pantalla es la forma de que se pulse Siguiente sin leer.
   */
  pasos = computed(() => {
    const secciones = this.datos()?.secciones ?? [];
    return ['aviso', ...secciones.map(s => s.id), 'cierre'];
  });

  /** La sección del paso actual, o null en el aviso y en el cierre. */
  seccionDelPaso = computed<ModelsInforme.Seccion | null>(() => {
    const indice = this.paso() - 1;
    const secciones = this.datos()?.secciones ?? [];
    return indice >= 0 && indice < secciones.length ? secciones[indice] : null;
  });

  esAviso = computed(() => this.paso() === 0);
  esCierre = computed(() => this.paso() === this.pasos().length - 1);

  constructor() {
    effect(() => {
      this.periodo();
      this.cargar();
    }, { allowSignalWrites: true });
  }

  async cargar() {
    this.cargando.set(true);
    try {
      const [datos] = await Promise.all([
        this._informe.reunir(),
        this.cargarHistorial(),
      ]);
      // Por defecto va lo que tiene datos. Una sección vacía se puede marcar
      // igual, pero quien la quiera en el documento tiene que pedirla.
      for (const s of datos.secciones) s.incluir = !s.sinDatos;
      this.datos.set(datos);
    } catch (error: unknown) {
      console.error('[InformeDiagnostico] reunir:', error);
      this._alerta.showError('No se pudieron reunir las cifras del informe.');
      this.datos.set(null);
    } finally {
      this.cargando.set(false);
    }
  }

  private async cargarHistorial() {
    try {
      this.historial.set(await this._informe.historial());
    } catch (error: unknown) {
      console.error('[InformeDiagnostico] historial:', error);
      this.historial.set([]);
    }
  }

  // ── Recorrido del asistente ───────────────────────────────────────────────

  abrirAsistente() {
    if (!this.datos()) return;
    this.paso.set(0);
    this.asistente.set(true);
  }

  cerrarAsistente() {
    this.asistente.set(false);
  }

  siguiente() {
    if (!this.esCierre()) this.paso.update(p => p + 1);
  }

  anterior() {
    if (this.paso() > 0) this.paso.update(p => p - 1);
  }

  /** Salta directo a un paso, para revisar algo sin recorrerlo todo otra vez. */
  irAlPaso(indice: number) {
    if (indice >= 0 && indice < this.pasos().length) this.paso.set(indice);
  }

  /**
   * Dónde se declara quién responde por el informe.
   *
   * Se busca por el campo y no por la posición de la sección. Estaba mirando
   * la sección cero, que era La organización hasta que la introducción pasó a
   * ir delante: desde entonces no encontraba la firma nunca y la emisión no
   * llegaba a intentarse. Buscar el dato es lo único que no se rompe cuando
   * el informe cambia de orden.
   */
  private ubicacionDelResponsable() {
    return this.ubicacionDe('responsable');
  }

  /** Dónde está un dato de identificación, buscado por su clave. */
  private ubicacionDe(clave: 'razonSocial' | 'nit' | 'responsable') {
    const secciones = this.datos()?.secciones ?? [];

    for (let i = 0; i < secciones.length; i++) {
      const dato = secciones[i].identificacion?.find(d => d.clave === clave);
      if (dato) return { indice: i, dato };
    }

    return null;
  }

  /**
   * El NIT tal como sale en el documento.
   *
   * Es solo lo que se imprime. El informe se sigue guardando bajo el NIT de
   * la empresa, que es el que lo encuentra en el historial.
   */
  nitDelInforme(): string {
    const escrito = (this.ubicacionDe('nit')?.dato.valor ?? '').trim();
    return escrito || this.datos()?.nitEmpresa || '';
  }

  /** La razón social tal como sale en el documento. Igual que el NIT. */
  nombreDelInforme(): string {
    const escrito = (this.ubicacionDe('razonSocial')?.dato.valor ?? '').trim();
    return escrito || this.datos()?.nombreEmpresa || '';
  }

  /** Quién firma el informe: el dato que el asistente propone y deja cambiar. */
  responsable(): string {
    return this.ubicacionDelResponsable()?.dato.valor ?? '';
  }

  // ── Emisión ───────────────────────────────────────────────────────────────

  async emitir() {
    const datos = this.datos();
    if (!datos || this.emitiendo()) return;

    const ubicacion = this.ubicacionDelResponsable();
    const firma = (ubicacion?.dato.valor ?? '').trim();

    if (!firma) {
      this._alerta.showWarning(
        'Falta el responsable del informe. Escríbelo en la sección La organización.'
      );
      // El paso lleva uno más que la sección, porque el aviso va delante.
      if (ubicacion) this.irAlPaso(ubicacion.indice + 1);
      return;
    }

    const incluidas = datos.secciones.filter(s => s.incluir !== false);
    if (!incluidas.length) {
      this._alerta.showWarning('Marca al menos una sección para incluir en el informe.');
      return;
    }

    this.emitiendo.set(true);
    try {
      // Se guarda solo lo que va en el documento: el informe emitido es la
      // copia de lo que se presentó, y lo desmarcado no se presentó.
      // El NIT y la razón social editados pasan a la portada y a la cabecera.
      // La ruta donde se guarda no los usa: sale del NIT de la empresa en
      // sesión.
      await this._informe.emitir(
        {
          ...datos,
          nitEmpresa: this.nitDelInforme(),
          nombreEmpresa: this.nombreDelInforme(),
          secciones: incluidas,
        },
        firma,
      );
      await this.cargarHistorial();
      this.asistente.set(false);
      this._alerta.showSuccess('Informe emitido. El anterior queda archivado.');

      // Se descarga solo: lo normal después de emitir es querer el documento,
      // y obligar a buscarlo en la tabla de abajo es un paso de más.
      const recien = this.vigente();
      if (recien) await this.descargar(recien);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'No se pudo emitir el informe.';
      console.error('[InformeDiagnostico] emitir:', error);
      this._alerta.showError(msg);
    } finally {
      this.emitiendo.set(false);
    }
  }

  /**
   * Arma el PDF de un informe ya emitido.
   *
   * Se rehace desde las cifras guardadas y no desde la pantalla: por eso un
   * informe archivado hace un año se descarga igual que el día que se emitió,
   * aunque el diagnóstico haya cambiado por completo desde entonces.
   */
  async descargar(informe: ModelsInforme.Informe) {
    if (this.descargando()) return;

    this.descargando.set(informe.id);
    try {
      await this._pdf.descargar(informe);
    } catch (error: unknown) {
      console.error('[InformeDiagnostico] descargar:', error);
      this._alerta.showError('No se pudo generar el PDF del informe.');
    } finally {
      this.descargando.set(null);
    }
  }

  /** La fecha de emisión, legible. */
  fechaDe(informe: ModelsInforme.Informe): string {
    const fecha = new Date(informe.fechaEmision);
    return isNaN(fecha.getTime())
      ? '—'
      : fecha.toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  /**
   * Alto de la gráfica según lo que tenga que pintar.
   *
   * Las horizontales crecen con el número de categorías; las verticales no lo
   * necesitan porque crecen a lo ancho.
   */
  alturaGrafica(reparto: ModelsInforme.Reparto): number {
    return reparto.grafica === 'barras' ? 60 + reparto.filas.length * 42 : 300;
  }

  /**
   * Las gráficas del proyecto reciben etiquetas y valores por separado, y hay
   * que darles siempre el mismo array.
   *
   * Calcularlos en la plantilla devolvía uno nuevo en cada ciclo de detección
   * de cambios. El gráfico lo veía como un dato distinto, se reconstruía y
   * repetía su animación sin parar, y con ello la página dejaba de
   * desplazarse. Se guardan la primera vez y se reutilizan.
   *
   * El almacén es débil: cuando el informe se recarga, lo anterior se
   * descarta solo.
   */
  private derivados = new WeakMap<ModelsInforme.Reparto, { etiquetas: string[]; valores: number[] }>();

  private derivadosDe(reparto: ModelsInforme.Reparto) {
    let guardado = this.derivados.get(reparto);
    if (!guardado) {
      guardado = {
        etiquetas: reparto.filas.map(f => f.etiqueta),
        valores: reparto.filas.map(f => f.total),
      };
      this.derivados.set(reparto, guardado);
    }
    return guardado;
  }

  etiquetasDe(reparto: ModelsInforme.Reparto): string[] {
    return this.derivadosDe(reparto).etiquetas;
  }

  valoresDe(reparto: ModelsInforme.Reparto): number[] {
    return this.derivadosDe(reparto).valores;
  }

  /** Secciones que van en el informe. */
  private incluidas(): ModelsInforme.Seccion[] {
    return (this.datos()?.secciones ?? []).filter(s => s.incluir !== false);
  }

  /** Secciones marcadas para el informe pero sin datos: saldrían vacías. */
  seccionesVacias(): string[] {
    return this.incluidas()
      .filter(s => s.sinDatos)
      .map(s => s.titulo);
  }

  /** Secciones que quien emite dejó fuera del informe. */
  seccionesExcluidas(): string[] {
    return (this.datos()?.secciones ?? [])
      .filter(s => s.incluir === false)
      .map(s => s.titulo);
  }

  /** Cifras marcadas como alerta en el informe, para verlas juntas. */
  alertas(): { seccion: string; cifra: ModelsInforme.Cifra }[] {
    return this.incluidas().flatMap(s =>
      s.cifras.filter(c => c.alerta).map(cifra => ({ seccion: s.titulo, cifra }))
    );
  }
}
