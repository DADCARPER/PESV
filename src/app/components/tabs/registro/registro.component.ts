import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FirestoreService } from '../../../services/shared/firestore.service';
import { AuthenticacionService } from '../../../services/shared/authenticacion.service';
import { NivelPesvService } from '../../../services/shared/nivel-pesv.service';
import { Models } from '../../../interfaces/models';
import { NOMBRE_NIVEL, NivelPesv, pasosExigibles } from '../../../data/modulos-pesv';
import { EstatusGeneralService } from '../../../services/shared/estatus-general.service';
import { AaDatosDefaultService } from '../../../services/shared/aa-datos-default.service';

interface Opcion {
  valor: string;
  titulo: string;
}

/** Pantallas del asistente: 1 bienvenida, 2 a 5 preguntas, 6 resultado. */
const PANTALLA_BIENVENIDA = 1;
const PRIMERA_PREGUNTA = 2;
const ULTIMA_PREGUNTA = 5;
const PANTALLA_RESULTADO = 6;

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './registro.component.html',
  styleUrl: './registro.component.css'
})
export class RegistroComponent implements OnInit, OnDestroy {

  private _auth = inject(AuthenticacionService);
  private _firestore = inject(FirestoreService);
  private _nivel = inject(NivelPesvService);
  private _progreso = inject(EstatusGeneralService);
  private _iniciardatos = inject(AaDatosDefaultService);
  private _router = inject(Router);

  private authSubscription: { unsubscribe(): void } | null = null;

  userId = '';
  nivelAcceso: NivelPesv = 'basico';
  nombreEmpresa = '';
  openTab = PANTALLA_BIENVENIDA;
  periodo = new Date().getFullYear();
  resultado: string | null = null;

  estadoGuardado: 'guardando' | 'ok' | 'error' = 'guardando';
  mensajeError = '';

  /** Los radios entregan texto; se convierte a número solo al calcular. */
  form = {
    actividad: '',
    vehiculos: '',
    conductores: '',
    numConductores: '',
    vehiculosTerceros: '',
  };

  readonly pasos = ['Actividad', 'Vehículos', 'Conductores', 'Terceros'];

  readonly actividades: Opcion[] = [
    { valor: 'transporte', titulo: 'Prestación de servicios de transporte terrestre automotor' },
    { valor: 'otra',       titulo: 'Actividades no relacionadas con el transporte' },
  ];

  // Cada valor representa su rango: el cálculo del nivel compara contra él
  readonly rangosVehiculos: Opcion[] = [
    { valor: '0',   titulo: 'Cero vehículos' },
    { valor: '10',  titulo: 'Menos de 11 vehículos' },
    { valor: '18',  titulo: 'Entre 11 y 19 vehículos' },
    { valor: '49',  titulo: 'Entre 20 y 50 vehículos' },
    { valor: '99',  titulo: 'Entre 51 y 100 vehículos' },
    { valor: '101', titulo: 'Más de 100 vehículos' },
  ];

  readonly rangosConductores: Opcion[] = [
    { valor: '1',   titulo: 'Menos de 2 conductores' },
    { valor: '3',   titulo: 'Entre 2 y 19 conductores' },
    { valor: '21',  titulo: 'Entre 20 y 50 conductores' },
    { valor: '51',  titulo: 'Entre 50 y 100 conductores' },
    { valor: '101', titulo: 'Más de 100 conductores' },
  ];

  readonly siNo: Opcion[] = [
    { valor: 'si', titulo: 'Sí' },
    { valor: 'no', titulo: 'No' },
  ];

  ngOnInit() {
    this.authSubscription = this._auth.authState.subscribe(user => {
      if (user) {
        this.userId = user.uid;
        this.llamarempresa();
      }
    });
  }

  ngOnDestroy() {
    this.authSubscription?.unsubscribe();
  }

  async llamarempresa() {
    const doc = await this._firestore.getDocument<Models.Users.Usuario>('users/' + this.userId);
    if (doc.exists()) {
      this.nombreEmpresa = doc.data().nombreEmpresa;
    }
  }

  // ── Navegación ────────────────────────────────────────────────────────────

  get enCuestionario(): boolean {
    return this.openTab >= PRIMERA_PREGUNTA && this.openTab <= ULTIMA_PREGUNTA;
  }

  /** Posición en la barra de avance: 0 para la primera pregunta. */
  get indicePaso(): number {
    return this.openTab - PRIMERA_PREGUNTA;
  }

  get esUltimaPregunta(): boolean {
    return this.openTab === ULTIMA_PREGUNTA;
  }

  /** Si hay conductores, también hay que decir cuántos antes de seguir. */
  puedeAvanzar(): boolean {
    switch (this.openTab) {
      case 2: return !!this.form.actividad;
      case 3: return !!this.form.vehiculos;
      case 4: return this.form.conductores === 'no'
                  || (this.form.conductores === 'si' && !!this.form.numConductores);
      case 5: return !!this.form.vehiculosTerceros;
      default: return true;
    }
  }

  alElegirConductores(valor: string) {
    if (valor === 'no') this.form.numConductores = '';
  }

  async toggleTabs(pantalla: number) {
    this.openTab = pantalla;
    if (pantalla === PANTALLA_RESULTADO) {
      await this.guardar();
    }
  }

  // ── Resultado ─────────────────────────────────────────────────────────────

  async guardar() {
    this.estadoGuardado = 'guardando';
    this.mensajeError = '';
    this.estadoGuardado = (await this.onSubmit()) ? 'ok' : 'error';
  }

  /**
   * Toda empresa registrada está obligada a tener PESV: el piso es Básico, y
   * el cuestionario solo decide si sube a Estándar o Avanzado.
   * Devuelve si el nivel quedó guardado.
   */
  private async onSubmit(): Promise<boolean> {
    const actividad = this.form.actividad;
    const vehiculos = Number(this.form.vehiculos) || 0;
    const conductores = Number(this.form.numConductores) || 0;

    if (actividad === 'transporte') {
      if (vehiculos > 50 || conductores > 50) {
        this.nivelAcceso = 'avanzado';
        this.resultado = 'Empresas dedicadas al transporte automotor con más de 50 vehículos o conductores.';
      } else if (vehiculos > 20 || conductores > 20) {
        this.nivelAcceso = 'medio';
        this.resultado = 'Empresas dedicadas al transporte automotor con una flota de entre 20 y 50 vehículos o entre 20 y 50 conductores.';
      } else {
        this.nivelAcceso = 'basico';
        this.resultado = 'Empresas dedicadas al transporte automotor con una flota de entre 11 y 19 vehículos o entre 2 y 19 conductores.';
      }
    } else if (actividad === 'otra') {
      if (vehiculos > 100 || conductores > 100) {
        this.nivelAcceso = 'avanzado';
        this.resultado = 'Organizaciones no relacionadas con el transporte, con más de 100 vehículos o conductores.';
      } else if (vehiculos > 50 || conductores > 50) {
        this.nivelAcceso = 'medio';
        this.resultado = 'Organizaciones no relacionadas con el transporte, con una flota de entre 50 y 100 vehículos o entre 50 y 100 conductores.';
      } else {
        this.nivelAcceso = 'basico';
        this.resultado = 'Organizaciones no relacionadas con el transporte, con una flota de entre 11 y 49 vehículos o entre 2 y 49 conductores.';
      }
    }

    try {
      await this._firestore.updateDocument('users/' + this.userId, {
        nivelAcceso: this.nivelAcceso,
        periodo: [this.periodo],
        encuestas: {
          actividad: this.form.actividad,
          numVehiculos: this.form.vehiculos,
          contrataConductores: this.form.conductores,
          numConductores: this.form.numConductores || null,
          vehiculosTerceros: this.form.vehiculosTerceros,
        }
      });
      // El nivel es de la empresa, no de quien responde: asi el siguiente
      // usuario que entre no vuelve a ver el cuestionario, y no puede haber
      // dos respuestas distintas para la misma organizacion.
      const nit = this._auth.getCurrentUser()?.displayName;
      if (nit) {
        await this._firestore.upsertDocument('Empresas/' + nit, {
          nivelAcceso: this.nivelAcceso,
        });
      }

      // Los tableros leen el nivel del servicio compartido: se lo pasamos ya
      this._nivel.establecer(this.nivelAcceso);

      // La empresa queda constituida aqui, asi que este es el momento de
      // sembrar su progreso y sus programas base. Antes lo hacia el registro
      // publico, que deja de existir: las empresas las crea el
      // superadministrador y sus usuarios llegan directamente a este paso.
      await this.sembrarDatosBase();
      return true;
    } catch (error: unknown) {
      this.mensajeError = error instanceof Error ? error.message : 'Error al guardar los datos';
      console.error('[Registro] onSubmit:', error);
      return false;
    }
  }

  /**
   * Crea el progreso inicial y los programas base de la empresa.
   *
   * Su fallo no puede tumbar el cuestionario: el nivel ya esta guardado, y los
   * programas se pueden cargar despues desde su propio modulo, que tiene un
   * boton para ello.
   */
  private async sembrarDatosBase(): Promise<void> {
    const nit = this._auth.getCurrentUser()?.displayName;
    if (!nit) return;

    const periodo = this._auth.periodo();
    try {
      await this._progreso.inicializarProgreso(nit, periodo);
      await this._iniciardatos.inicializarDatos008Programas(nit, periodo);
    } catch (error: unknown) {
      console.error('[Registro] sembrarDatosBase:', error);
    }
  }

  get nombreNivel(): string {
    return NOMBRE_NIVEL[this.nivelAcceso];
  }

  /** Cuántos de los 24 pasos le exige la norma a este nivel. */
  get pasosNivel(): number {
    return pasosExigibles(this.nivelAcceso).length;
  }

  /** Mismo tono que la etiqueta de nivel del navbar. */
  get claseTextoNivel(): string {
    switch (this.nivelAcceso) {
      case 'avanzado': return 'text-green-700';
      case 'medio':    return 'text-amber-600';
      default:         return 'text-blue-700';
    }
  }

  // ── Presentación de las opciones ──────────────────────────────────────────

  claseOpcion(activa: boolean): string {
    return activa
      ? 'border-orange-500 bg-orange-50'
      : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50';
  }

  claseMarca(activa: boolean): string {
    return activa ? 'border-orange-500 bg-orange-500' : 'border-gray-300 bg-white';
  }

  /**
   * Al terminar el cuestionario se va a los datos de la empresa, no al panel.
   *
   * Esos datos (razon social, ciudad, representante legal) se imprimen en las
   * actas de los modulos 1 a 4. Los carga el administrador al crear la cuenta,
   * asi que lo que toca aqui es que la empresa los verifique.
   * El parametro `bienvenida` hace que la pantalla lo explique esta vez.
   */
  irAlPerfil() {
    this._router.navigate(['admin/empresa'], { queryParams: { bienvenida: 1 } });
  }
}
