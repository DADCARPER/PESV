/**
 * Roles de usuario dentro de una empresa.
 *
 * El rol es distinto del nivel PESV: el nivel (básico, estándar, avanzado) dice
 * cuántos pasos le exige la norma a la empresa; el rol dice qué puede hacer
 * cada persona con esos pasos.
 *
 * Varios usuarios comparten empresa a través del mismo `nitEmpresa`, que es lo
 * que la Cloud Function convierte en el custom claim `nit`.
 */

export type RolUsuario = 'operativo' | 'supervisor';

export const ROL_POR_DEFECTO: RolUsuario = 'operativo';

/**
 * Valor que el registro guardaba antes de existir los roles. Se trata como
 * operativo para no dejar fuera a las cuentas ya creadas.
 */
const ROL_HEREDADO = 'empresa';

export const NOMBRE_ROL: Record<RolUsuario, string> = {
  operativo: 'Operativo',
  supervisor: 'Supervisor',
};

export const DESCRIPCION_ROL: Record<RolUsuario, string> = {
  operativo: 'Construye el PESV: carga documentos, registra datos y avanza los pasos.',
  supervisor: 'Revisa el avance del PESV y deja observaciones, sin modificar la información.',
};

/** Normaliza lo que venga de Firestore o del token a un rol conocido. */
export function aRolUsuario(valor: unknown): RolUsuario {
  if (valor === 'supervisor') return 'supervisor';
  if (valor === 'operativo' || valor === ROL_HEREDADO) return 'operativo';
  return ROL_POR_DEFECTO;
}

/**
 * ¿Puede modificar la información del PESV?
 *
 * Esto solo decide qué se muestra. La restricción real vive en las reglas de
 * Firestore y Storage, que leen el claim `rol`: ocultar un botón no impide
 * escribir desde la consola del navegador.
 */
export function puedeEditar(rol: RolUsuario): boolean {
  return rol === 'operativo';
}

/** ¿Puede dejar observaciones? Ambos roles pueden, para poder responderse. */
export function puedeComentar(_rol: RolUsuario): boolean {
  return true;
}
