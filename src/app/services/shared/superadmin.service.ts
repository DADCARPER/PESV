import { inject, Injectable } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';

/** Un usuario tal como lo devuelve el panel de administración. */
export interface UsuarioAdmin {
  uid: string;
  nombreCompleto: string;
  email: string;
  nombreEmpresa: string;
  nitEmpresa: string;
  rol: 'operativo' | 'supervisor';
  nivelAcceso: string;
  telefono: string;
  cargoEmpresa: string;
  /** ISO de Auth; null si nunca ha entrado. */
  ultimoAcceso: string | null;
  deshabilitado: boolean;
  /** Tiene documento en Firestore pero no cuenta en Authentication. */
  sinCuenta: boolean;
}

/** Una empresa con los usuarios que tiene asociados. */
export interface EmpresaAdmin {
  nitEmpresa: string;
  nombreEmpresa: string;
  nivelAcceso: string;
  /** Usuarios contratados; null o 0 significa sin límite. */
  usuariosContratados: number | null;
  usuarios: UsuarioAdmin[];
}

/** Datos para dar de alta una empresa con su usuario operativo. */
export interface NuevaEmpresa {
  email: string;
  password: string;
  nombreCompleto: string;
  nitEmpresa: string;
  nombreEmpresa: string;
  cargoEmpresa?: string;
  telefono?: string;
}

/** Datos para añadir un usuario a una empresa que ya existe. */
export interface NuevoUsuarioEmpresa {
  email: string;
  password: string;
  nombreCompleto: string;
  /** NIT de la empresa a la que se une. */
  nitEmpresa: string;
  /** operativo construye el PESV; supervisor solo lo revisa. */
  rol: 'operativo' | 'supervisor';
  cargoEmpresa?: string;
  telefono?: string;
}

/**
 * Operaciones reservadas al superadministrador.
 *
 * Todo pasa por Cloud Functions y no por Firestore directamente, por dos
 * razones: crear cuentas desde el SDK de cliente cambiaría la sesión activa y
 * expulsaría al propio administrador, y el permiso se valida en el servidor,
 * que es donde no se puede sortear.
 */
@Injectable({
  providedIn: 'root'
})
export class SuperadminService {

  private _functions = inject(Functions);

  /** Empresas con sus usuarios, y las cuentas que no pertenecen a ninguna. */
  async listarEmpresas(): Promise<{ empresas: EmpresaAdmin[]; huerfanos: UsuarioAdmin[] }> {
    const llamar = httpsCallable<unknown, { empresas: EmpresaAdmin[]; huerfanos: UsuarioAdmin[] }>(
      this._functions,
      'listarEmpresas'
    );
    const respuesta = await llamar();
    return {
      empresas: respuesta.data?.empresas ?? [],
      huerfanos: respuesta.data?.huerfanos ?? [],
    };
  }

  /** Da de alta una empresa nueva con su primer usuario operativo. */
  async crearUsuarioEmpresa(datos: NuevaEmpresa): Promise<void> {
    const llamar = httpsCallable(this._functions, 'crearUsuarioEmpresa');
    await llamar(datos);
  }

  /** Añade un usuario a una empresa existente, con el rol indicado. */
  async crearUsuarioEnEmpresa(datos: NuevoUsuarioEmpresa): Promise<void> {
    const llamar = httpsCallable(this._functions, 'crearUsuarioEnEmpresa');
    await llamar(datos);
  }

  /** Fija los usuarios contratados de una empresa. Cero es sin límite. */
  async fijarCupo(nitEmpresa: string, usuariosContratados: number): Promise<void> {
    const llamar = httpsCallable(this._functions, 'fijarCupoEmpresa');
    await llamar({ nitEmpresa, usuariosContratados });
  }
}
