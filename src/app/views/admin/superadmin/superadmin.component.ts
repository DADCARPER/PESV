import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  SuperadminService, EmpresaAdmin, UsuarioAdmin,
} from '../../../services/shared/superadmin.service';
import { NOMBRE_NIVEL, NivelPesv, esNivelPesv } from '../../../data/modulos-pesv';
import { NOMBRE_ROL } from '../../../data/roles';
import { AuthenticacionService } from '../../../services/shared/authenticacion.service';
import { RUTA_LOGIN } from '../../../guards/auth.guard';

/** Qué formulario está abierto, si alguno. */
type Formulario = 'ninguno' | 'empresa' | 'usuario' | 'cupo';

@Component({
  selector: 'app-superadmin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './superadmin.component.html',
})
export class SuperadminComponent implements OnInit {

  private _superadmin = inject(SuperadminService);
  private _auth = inject(AuthenticacionService);
  private _router = inject(Router);

  /** Correo de la sesion: este panel no lleva el navbar con el desplegable. */
  readonly correo = this._auth.getCurrentUser()?.email ?? '';

  empresas = signal<EmpresaAdmin[]>([]);
  huerfanos = signal<UsuarioAdmin[]>([]);
  cargando = signal(true);
  error = signal('');

  /** Texto del buscador: empresa, NIT, nombre o correo de sus usuarios. */
  filtro = signal('');

  /** NIT de las empresas con la lista de usuarios desplegada. */
  abiertas = signal<Set<string>>(new Set());

  // ── Formularios ───────────────────────────────────────────────────────────

  formulario = signal<Formulario>('ninguno');
  guardando = signal(false);
  errorFormulario = signal('');
  exito = signal('');

  /** Empresa sobre la que se está actuando. */
  destino = signal<EmpresaAdmin | null>(null);

  nuevo = {
    email: '',
    password: '',
    nombreCompleto: '',
    nitEmpresa: '',
    nombreEmpresa: '',
    cargoEmpresa: '',
    telefono: '',
    rol: 'operativo' as 'operativo' | 'supervisor',
  };

  cupo = 0;

  readonly empresasFiltradas = computed(() => {
    const texto = this.filtro().trim().toLowerCase();
    if (!texto) return this.empresas();

    return this.empresas().filter(e =>
      [e.nombreEmpresa, e.nitEmpresa].some(c => (c ?? '').toLowerCase().includes(texto))
      || e.usuarios.some(u =>
        [u.nombreCompleto, u.email].some(c => (c ?? '').toLowerCase().includes(texto)))
    );
  });

  readonly totalUsuarios = computed(
    () => this.empresas().reduce((n, e) => n + e.usuarios.length, 0)
  );

  readonly totalOperativos = computed(
    () => this.empresas().reduce(
      (n, e) => n + e.usuarios.filter(u => u.rol === 'operativo').length, 0)
  );

  readonly totalSupervisores = computed(
    () => this.empresas().reduce(
      (n, e) => n + e.usuarios.filter(u => u.rol === 'supervisor').length, 0)
  );

  ngOnInit(): void {
    this.cargar();
  }

  async salir() {
    try {
      await this._auth.logout();
    } catch (error: unknown) {
      console.error('[Superadmin] logout:', error);
    }
    // Navegar siempre: el guard solo se evalua al cambiar de ruta, asi que sin
    // esto el panel seguiria en pantalla con la sesion ya cerrada.
    this._router.navigate([RUTA_LOGIN]);
  }

  async cargar() {
    this.cargando.set(true);
    this.error.set('');
    try {
      const datos = await this._superadmin.listarEmpresas();
      this.empresas.set(datos.empresas);
      this.huerfanos.set(datos.huerfanos);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'No se pudo cargar la lista';
      console.error('[Superadmin] listarEmpresas:', error);
      this.error.set(msg);
    } finally {
      this.cargando.set(false);
    }
  }

  // ── Despliegue de usuarios ────────────────────────────────────────────────

  alternar(nit: string) {
    const set = new Set(this.abiertas());
    if (set.has(nit)) {
      set.delete(nit);
    } else {
      set.add(nit);
    }
    this.abiertas.set(set);
  }

  estaAbierta(nit: string): boolean {
    return this.abiertas().has(nit);
  }

  // ── Formularios ───────────────────────────────────────────────────────────

  abrirEmpresa() {
    this.limpiar();
    this.destino.set(null);
    this.formulario.set('empresa');
  }

  abrirUsuario(empresa: EmpresaAdmin, rol: 'operativo' | 'supervisor') {
    this.limpiar();
    this.destino.set(empresa);
    this.nuevo.nitEmpresa = empresa.nitEmpresa;
    this.nuevo.rol = rol;
    this.formulario.set('usuario');
  }

  abrirCupo(empresa: EmpresaAdmin) {
    this.limpiar();
    this.destino.set(empresa);
    this.cupo = empresa.usuariosContratados ?? 0;
    this.formulario.set('cupo');
  }

  cerrarFormulario() {
    this.formulario.set('ninguno');
    this.errorFormulario.set('');
  }

  private limpiar() {
    this.nuevo = {
      email: '', password: '', nombreCompleto: '',
      nitEmpresa: '', nombreEmpresa: '', cargoEmpresa: '', telefono: '',
      rol: 'operativo',
    };
    this.cupo = 0;
    this.errorFormulario.set('');
    this.exito.set('');
  }

  async guardar() {
    this.guardando.set(true);
    this.errorFormulario.set('');
    try {
      const modo = this.formulario();

      if (modo === 'empresa') {
        await this._superadmin.crearUsuarioEmpresa({ ...this.nuevo });
        this.exito.set(`Empresa creada. ${this.nuevo.email} ya puede iniciar sesión.`);

      } else if (modo === 'usuario') {
        await this._superadmin.crearUsuarioEnEmpresa({ ...this.nuevo });
        const queEs = this.nuevo.rol === 'operativo' ? 'Operativo' : 'Supervisor';
        this.exito.set(`${queEs} creado para ${this.destino()?.nombreEmpresa ?? 'la empresa'}.`);

      } else if (modo === 'cupo') {
        const nit = this.destino()?.nitEmpresa ?? '';
        await this._superadmin.fijarCupo(nit, this.cupo);
        this.exito.set(this.cupo > 0
          ? `Cupo fijado en ${this.cupo} usuarios.`
          : 'Cupo retirado: la empresa queda sin límite.');
      }

      this.cerrarFormulario();
      await this.cargar();
    } catch (error: unknown) {
      // Los mensajes vienen de la función, ya en un lenguaje comprensible.
      const msg = error instanceof Error ? error.message : 'No se pudo completar la operación';
      console.error('[Superadmin] guardar:', error);
      this.errorFormulario.set(msg);
    } finally {
      this.guardando.set(false);
    }
  }

  /** Falta algún campo obligatorio del formulario abierto. */
  get formularioIncompleto(): boolean {
    if (this.formulario() === 'cupo') return false;

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

  /** Texto del cupo: "3 de 5" o solo el número si no hay límite. */
  ocupacion(e: EmpresaAdmin): string {
    const usados = e.usuarios.length;
    const cupo = e.usuariosContratados;
    if (!cupo || cupo <= 0) return `${usados} ${usados === 1 ? 'usuario' : 'usuarios'}`;
    return `${usados} de ${cupo} usuarios`;
  }

  /** La empresa agotó su cupo: no se pueden crear más usuarios. */
  cupoAgotado(e: EmpresaAdmin): boolean {
    const cupo = e.usuariosContratados;
    return !!cupo && cupo > 0 && e.usuarios.length >= cupo;
  }

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
