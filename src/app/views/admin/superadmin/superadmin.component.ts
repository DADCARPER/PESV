import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SuperadminService, UsuarioAdmin } from '../../../services/shared/superadmin.service';
import { NOMBRE_NIVEL, NivelPesv, esNivelPesv } from '../../../data/modulos-pesv';
import { NOMBRE_ROL } from '../../../data/roles';

/** Qué formulario de alta está abierto, si alguno. */
type Formulario = 'ninguno' | 'empresa' | 'supervisor';

@Component({
  selector: 'app-superadmin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './superadmin.component.html',
})
export class SuperadminComponent implements OnInit {

  private _superadmin = inject(SuperadminService);

  usuarios = signal<UsuarioAdmin[]>([]);
  cargando = signal(true);
  error = signal('');

  filtro = signal('');
  filtroRol = signal('');

  // ── Alta de usuarios ──────────────────────────────────────────────────────

  formulario = signal<Formulario>('ninguno');
  guardando = signal(false);
  errorFormulario = signal('');
  exito = signal('');

  /** Empresa sobre la que se crea el supervisor. */
  empresaDestino = signal<UsuarioAdmin | null>(null);

  nuevo = {
    email: '',
    password: '',
    nombreCompleto: '',
    nitEmpresa: '',
    nombreEmpresa: '',
    cargoEmpresa: '',
    telefono: '',
  };

  readonly usuariosFiltrados = computed(() => {
    const texto = this.filtro().trim().toLowerCase();
    const rol = this.filtroRol();

    return this.usuarios().filter(u => {
      if (rol && u.rol !== rol) return false;
      if (!texto) return true;

      return [u.nombreCompleto, u.email, u.nombreEmpresa, u.nitEmpresa]
        .some(campo => (campo ?? '').toLowerCase().includes(texto));
    });
  });

  readonly totalOperativos = computed(
    () => this.usuarios().filter(u => u.rol === 'operativo').length
  );

  readonly totalSupervisores = computed(
    () => this.usuarios().filter(u => u.rol === 'supervisor').length
  );

  readonly totalEmpresas = computed(
    () => new Set(this.usuarios().map(u => u.nitEmpresa).filter(Boolean)).size
  );

  ngOnInit(): void {
    this.cargar();
  }

  async cargar() {
    this.cargando.set(true);
    this.error.set('');
    try {
      this.usuarios.set(await this._superadmin.listarUsuarios());
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'No se pudo cargar la lista';
      console.error('[Superadmin] listarUsuarios:', error);
      this.error.set(msg);
    } finally {
      this.cargando.set(false);
    }
  }

  // ── Formularios ───────────────────────────────────────────────────────────

  abrirEmpresa() {
    this.limpiarFormulario();
    this.empresaDestino.set(null);
    this.formulario.set('empresa');
  }

  /** El supervisor se crea siempre sobre un operativo concreto. */
  abrirSupervisor(operativo: UsuarioAdmin) {
    this.limpiarFormulario();
    this.empresaDestino.set(operativo);
    this.nuevo.nitEmpresa = operativo.nitEmpresa;
    this.formulario.set('supervisor');
  }

  cerrarFormulario() {
    this.formulario.set('ninguno');
    this.errorFormulario.set('');
  }

  private limpiarFormulario() {
    this.nuevo = {
      email: '', password: '', nombreCompleto: '',
      nitEmpresa: '', nombreEmpresa: '', cargoEmpresa: '', telefono: '',
    };
    this.errorFormulario.set('');
    this.exito.set('');
  }

  async guardar() {
    this.guardando.set(true);
    this.errorFormulario.set('');
    try {
      if (this.formulario() === 'empresa') {
        await this._superadmin.crearUsuarioEmpresa({ ...this.nuevo });
        this.exito.set(`Empresa creada. ${this.nuevo.email} ya puede iniciar sesión.`);
      } else {
        await this._superadmin.crearSupervisor({ ...this.nuevo });
        const empresa = this.empresaDestino()?.nombreEmpresa ?? 'la empresa';
        this.exito.set(`Supervisor creado para ${empresa}.`);
      }

      this.cerrarFormulario();
      await this.cargar();
    } catch (error: unknown) {
      // Los mensajes vienen de la función, ya en un lenguaje comprensible.
      const msg = error instanceof Error ? error.message : 'No se pudo crear el usuario';
      console.error('[Superadmin] guardar:', error);
      this.errorFormulario.set(msg);
    } finally {
      this.guardando.set(false);
    }
  }

  /** Falta algún campo obligatorio del formulario abierto. */
  get formularioIncompleto(): boolean {
    const base = !this.nuevo.email.trim()
      || !this.nuevo.password.trim()
      || !this.nuevo.nombreCompleto.trim()
      || !this.nuevo.nitEmpresa.trim();

    if (this.formulario() === 'empresa') {
      return base || !this.nuevo.nombreEmpresa.trim();
    }
    return base;
  }

  // ── Presentación ──────────────────────────────────────────────────────────

  nombreRol(rol: 'operativo' | 'supervisor'): string {
    return NOMBRE_ROL[rol];
  }

  /** El nivel se guarda en crudo; 'no' significa onboarding sin terminar. */
  nombreNivel(valor: string): string {
    if (valor === 'no' || !valor) return 'Sin definir';
    return esNivelPesv(valor) ? NOMBRE_NIVEL[valor as NivelPesv] : valor;
  }

  fecha(iso: string | null): string {
    if (!iso) return 'Nunca';
    return new Date(iso).toLocaleDateString('es-CO', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
  }
}
