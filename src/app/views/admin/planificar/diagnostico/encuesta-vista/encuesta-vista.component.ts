import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit, inject, signal, computed } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormControl, FormArray } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { FirestoreService } from '../../../../../services/shared/firestore.service';
import { AlertaService } from '../../../../../services/shared/alerta.service';
import { ModelsEncuestas } from '../../../../../interfaces/encuestas.interface';
import { AlertaInformativoComponent } from "../../../../../components/alertas/alerta-informativo/alerta-informativo.component";

/** Lo que el documento raíz de la empresa le dice a quien no tiene sesión. */
interface CabeceraPublica {
  nombreEmpresa?: string;
  periodoActivo?: number;
  mostrarEncuesta?: boolean;
}

/**
 * La encuesta pública, construida a partir del cuestionario que la empresa
 * activó.
 *
 * Antes las preguntas vivían en un FormGroup de 57 controles y una plantilla de
 * 1.642 líneas con cada opción escrita a mano, así que cambiar una coma exigía
 * recompilar. Ahora se leen de la copia guardada bajo la empresa y el
 * formulario se arma al vuelo.
 */
@Component({
  selector: 'app-encuesta-vista',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AlertaInformativoComponent],
  templateUrl: './encuesta-vista.component.html',
  styleUrl: './encuesta-vista.component.css'
})
export class EncuestaVistaComponent implements OnInit {

  private route = inject(ActivatedRoute);
  private _firestore = inject(FirestoreService);
  private fb = inject(FormBuilder);
  public _alerta = inject(AlertaService);

  nitEmpresa = '';
  nombreEmpresa = signal('');

  cargando = signal(true);
  /** La empresa no existe o nunca activó una encuesta. */
  noEncontrada = signal(false);
  /** Existe, pero el enlace está cerrado ahora mismo. */
  cerrada = signal(false);
  /** Ya se envió: se muestra el agradecimiento. */
  enviada = signal(false);
  enviando = signal(false);

  encuesta = signal<ModelsEncuestas.EncuestaActiva | null>(null);
  formulario!: FormGroup;
  openTab = 0;

  /** Qué falta por contestar, agrupado por módulo, tras intentar enviar. */
  faltantes = signal<{ titulo: string; preguntas: string[] }[]>([]);

  /** Solo los módulos que la empresa activó. Los fijos van siempre. */
  readonly modulos = computed<ModelsEncuestas.Modulo[]>(() => {
    const copia = this.encuesta();
    if (!copia) return [];
    return copia.modulos.filter(m => m.fijo || copia.modulosActivos.includes(m.id));
  });

  async ngOnInit() {
    this.nitEmpresa = this.route.snapshot.paramMap.get('nitEmpresa') ?? '';
    await this.cargar();
  }

  private async cargar() {
    this.cargando.set(true);
    try {
      const cabecera = await this._firestore.getDocument<CabeceraPublica>(
        `Encuestas_publicas/${this.nitEmpresa}`
      );

      if (!cabecera.exists() || !cabecera.data()?.periodoActivo) {
        this.noEncontrada.set(true);
        return;
      }

      const datos = cabecera.data()!;
      this.nombreEmpresa.set(datos.nombreEmpresa ?? '');

      if (!datos.mostrarEncuesta) {
        this.cerrada.set(true);
        return;
      }

      const copia = await this._firestore.getDocument<ModelsEncuestas.EncuestaActiva>(
        `Encuestas_publicas/${this.nitEmpresa}/cuestionarios/${datos.periodoActivo}`
      );

      if (!copia.exists()) {
        this.noEncontrada.set(true);
        return;
      }

      this.encuesta.set(copia.data());
      this.construirFormulario();
      this.detectarBorrador();
    } catch (error: unknown) {
      console.error('[EncuestaVista] cargar:', error);
      this.noEncontrada.set(true);
    } finally {
      this.cargando.set(false);
    }
  }

  // ── Construcción del formulario ───────────────────────────────────────────

  /**
   * Un control por pregunta.
   *
   * Las de varias opciones usan un FormArray, porque la respuesta es una lista.
   * Las obligatorias no llevan validador de Angular: muchas dependen de otra
   * respuesta y estarían exigiendo un valor que ni siquiera se ve en pantalla.
   * La comprobación se hace al enviar, sobre lo que esté visible.
   */
  private construirFormulario() {
    const controles: Record<string, FormControl | FormArray> = {};

    for (const modulo of this.modulos()) {
      for (const pregunta of modulo.preguntas) {
        controles[pregunta.id] = pregunta.tipo === 'multiple'
          ? this.fb.array([])
          : this.fb.control('');

        if (pregunta.campoOtro) controles[pregunta.campoOtro] = this.fb.control('');
      }
    }

    this.formulario = this.fb.group(controles);
  }

  /**
   * La pregunta se muestra: no tiene condición, o la condición se cumple.
   *
   * La pregunta de la que depende puede ser de varias opciones, y entonces su
   * valor no es una cadena sino una lista. Comparar la lista entera contra los
   * valores esperados no acierta nunca, así que una condición apoyada en una
   * pregunta de ese tipo dejaba la dependiente oculta para siempre, sin que
   * nada avisara.
   */
  visible(pregunta: ModelsEncuestas.Pregunta): boolean {
    const condicion = pregunta.condicion;
    if (!condicion) return true;

    const valor = this.formulario.get(condicion.pregunta)?.value;

    return Array.isArray(valor)
      ? valor.some((v) => condicion.valores.includes(v))
      : condicion.valores.includes(valor);
  }

  arrayDe(pregunta: ModelsEncuestas.Pregunta): FormArray {
    return this.formulario.get(pregunta.id) as FormArray;
  }

  marcado(pregunta: ModelsEncuestas.Pregunta, valor: string): boolean {
    return this.arrayDe(pregunta).value.includes(valor);
  }

  alMarcar(pregunta: ModelsEncuestas.Pregunta, valor: string, evento: Event) {
    const lista = this.arrayDe(pregunta);
    if ((evento.target as HTMLInputElement).checked) {
      lista.push(this.fb.control(valor));
    } else {
      const i = lista.value.indexOf(valor);
      if (i >= 0) lista.removeAt(i);
    }
    this.guardarProgreso();
  }

  /** Se marcó una opción del estilo "Otro" y hay que pedir el texto. */
  pideOtro(pregunta: ModelsEncuestas.Pregunta): boolean {
    if (!pregunta.campoOtro) return false;
    const valor = this.formulario.get(pregunta.id)?.value;
    return Array.isArray(valor) ? valor.includes('Otro') : valor === 'Otro';
  }

  // ── Navegación ────────────────────────────────────────────────────────────

  irA(indice: number) {
    this.openTab = indice;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  siguiente() { if (this.openTab < this.modulos().length - 1) this.irA(this.openTab + 1); }
  anterior() { if (this.openTab > 0) this.irA(this.openTab - 1); }

  get esUltimo(): boolean { return this.openTab === this.modulos().length - 1; }

  // ── Progreso local ────────────────────────────────────────────────────────

  private clave(): string { return `pesv_encuesta_${this.nitEmpresa}`; }

  /**
   * La encuesta es larga y se contesta desde el móvil. Guardar lo escrito en
   * el propio navegador evita que una llamada entrante borre diez minutos de
   * trabajo.
   *
   * No se guarda nada una vez enviada: el formulario sigue cargado en memoria,
   * y al cerrar la pestaña se volvía a escribir lo ya entregado. Por eso la
   * encuesta reaparecía rellena al abrir el enlace otra vez.
   */
  guardarProgreso() {
    if (!this.formulario || this.enviada()) return;
    try {
      localStorage.setItem(this.clave(), JSON.stringify({
        v: this.formulario.value, t: this.openTab, ts: Date.now(),
      }));
    } catch (error: unknown) {
      // Navegación privada o almacenamiento lleno: no vale la pena molestar.
    }
  }

  /** Lo guardado a medias que se ofrece recuperar, con cuándo se dejó. */
  borrador = signal<{ fecha: string } | null>(null);

  /**
   * Mira si hay algo a medias, pero no lo carga: lo ofrece.
   *
   * El enlace se difunde por los canales de la empresa y puede abrirse en un
   * equipo compartido. Rellenar el formulario solo por haberlo encontrado
   * guardado le pondría a alguien el nombre y la cédula de otro sin avisar.
   */
  private detectarBorrador() {
    try {
      const guardado = localStorage.getItem(this.clave());
      if (!guardado) return;

      const { ts } = JSON.parse(guardado);
      const fecha = ts
        ? new Date(ts).toLocaleString('es-CO', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
        : '';
      this.borrador.set({ fecha });
    } catch (error: unknown) {
      console.error('[EncuestaVista] detectarBorrador:', error);
    }
  }

  /** Carga lo que había a medias y sigue por donde iba. */
  continuarBorrador() {
    try {
      const guardado = localStorage.getItem(this.clave());
      if (!guardado) return;
      const { v, t } = JSON.parse(guardado);

      for (const [id, valor] of Object.entries(v ?? {})) {
        const control = this.formulario.get(id);
        if (!control) continue;
        if (control instanceof FormArray) {
          control.clear();
          for (const item of (valor as string[]) ?? []) control.push(this.fb.control(item));
        } else {
          control.setValue(valor);
        }
      }
      this.openTab = Math.min(t ?? 0, this.modulos().length - 1);
    } catch (error: unknown) {
      console.error('[EncuestaVista] continuarBorrador:', error);
    } finally {
      this.borrador.set(null);
    }
  }

  /** Descarta lo guardado y empieza en blanco. */
  descartarBorrador() {
    this.olvidarBorrador();
    this.borrador.set(null);
  }

  private olvidarBorrador() {
    try {
      localStorage.removeItem(this.clave());
    } catch (error: unknown) {
      // Nada que hacer si el navegador no deja tocar el almacenamiento.
    }
  }

  @HostListener('window:beforeunload')
  alSalir() { this.guardarProgreso(); }

  // ── Envío ─────────────────────────────────────────────────────────────────

  /** Lo obligatorio que está visible y sin contestar, agrupado por módulo. */
  private revisar(): { titulo: string; preguntas: string[] }[] {
    const pendientes: { titulo: string; preguntas: string[] }[] = [];

    for (const modulo of this.modulos()) {
      const sinContestar = modulo.preguntas
        .filter(p => p.obligatoria && this.visible(p))
        .filter(p => {
          const valor = this.formulario.get(p.id)?.value;
          return Array.isArray(valor) ? valor.length === 0 : !String(valor ?? '').trim();
        })
        .map(p => p.etiqueta);

      if (sinContestar.length) pendientes.push({ titulo: modulo.titulo, preguntas: sinContestar });
    }
    return pendientes;
  }

  async enviar() {
    const pendientes = this.revisar();
    this.faltantes.set(pendientes);

    if (pendientes.length) {
      this._alerta.showWarning('Faltan respuestas obligatorias.');
      return;
    }

    const copia = this.encuesta();
    if (!copia) return;

    this.enviando.set(true);
    try {
      const respuesta: Record<string, unknown> = { ...this.formulario.value };

      // El texto de "Otro" se funde con la respuesta y deja de ser un campo
      // suelto, para que en los resultados se lea de corrido.
      for (const modulo of this.modulos()) {
        for (const pregunta of modulo.preguntas) {
          if (!pregunta.campoOtro) continue;
          const otro = String(respuesta[pregunta.campoOtro] ?? '').trim();
          const valor = respuesta[pregunta.id];

          if (otro) {
            if (Array.isArray(valor)) {
              const i = valor.indexOf('Otro');
              if (i >= 0) valor[i] = `Otro: ${otro}`;
            } else if (valor === 'Otro') {
              respuesta[pregunta.id] = `Otro: ${otro}`;
            }
          }
          delete respuesta[pregunta.campoOtro];
        }
      }

      // Sellada con el cuestionario al que contesto: es lo que permite
      // reproducir el diagnostico anos despues y lo que congela la encuesta.
      respuesta['encuestaId'] = copia.encuestaId;
      respuesta['encuestaVersion'] = copia.version;
      respuesta['periodo'] = copia.periodo;

      await this._firestore.createDocument(
        `Encuestas_publicas/${this.nitEmpresa}/encuestas`, respuesta
      );

      // Antes de nada: en cuanto esta enviada, guardarProgreso deja de
      // escribir, asi que cerrar la pestana ya no resucita lo entregado.
      this.enviada.set(true);
      this.olvidarBorrador();
      this.formulario.reset();
    } catch (error: unknown) {
      console.error('[EncuestaVista] enviar:', error);
      this._alerta.showError('No se pudo enviar. Revisa tu conexión e inténtalo de nuevo.');
    } finally {
      this.enviando.set(false);
    }
  }
}
