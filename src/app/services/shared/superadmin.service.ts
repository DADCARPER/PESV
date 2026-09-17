import { inject, Injectable } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';

/** Un usuario tal como lo devuelve la función listarUsuarios. */
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

/** Datos para dar de alta un supervisor sobre una empresa existente. */
export interface NuevoSupervisor {
  email: string;
  password: string;
  nombreCompleto: string;
  /** NIT de la empresa que va a supervisar. */
  nitEmpresa: string;
  cargoEmpresa?: string;
  telefono?: string;
}

/**
 * Consultas reservadas al superadministrador.
 *
 * Los datos llegan por Cloud Function y no leyendo Firestore directamente: el
 * proyecto no versiona sus reglas de Firestore, así que el permiso se valida
 * en el servidor, donde sí se controla.
 */
@Injectable({
  providedIn: 'root'
})
export class SuperadminService {

  private _functions = inject(Functions);

  /**
   * Crea la cuenta operativa de una empresa nueva.
   *
   * Va por función y no por el SDK de cliente porque crear una cuenta desde el
   * navegador cambia la sesión activa: el panel expulsaría al superadmin.
   */
  async crearUsuarioEmpresa(datos: NuevaEmpresa): Promise<void> {
    const llamar = httpsCallable(this._functions, 'crearUsuarioEmpresa');
    await llamar(datos);
  }

  /** Crea un supervisor sobre una empresa que ya existe. */
  async crearSupervisor(datos: NuevoSupervisor): Promise<void> {
    const llamar = httpsCallable(this._functions, 'crearSupervisor');
    await llamar(datos);
  }

  async listarUsuarios(): Promise<UsuarioAdmin[]> {
    const llamar = httpsCallable<unknown, { usuarios: UsuarioAdmin[] }>(
      this._functions,
      'listarUsuarios'
    );
    const respuesta = await llamar();
    return respuesta.data?.usuarios ?? [];
  }
}
