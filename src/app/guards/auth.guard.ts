import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthenticacionService } from '../services/shared/authenticacion.service';
import { FirestoreService } from '../services/shared/firestore.service';
import { Models } from '../interfaces/models';

/** Ruta única del formulario de acceso. Cualquier redirección de sesión apunta aquí. */
export const RUTA_LOGIN = '/auth/login';

/** Ruta a la que llega un usuario ya autenticado. */
export const RUTA_INICIO = '/admin/dashboard';

/** Cuestionario que fija el nivel PESV de la empresa. */
export const RUTA_ONBOARDING = '/starting';

/** Valor de `nivelAcceso` mientras el onboarding sigue pendiente. */
const SIN_NIVEL = 'no';

/**
 * Lee el nivel PESV de la empresa.
 *
 * El nivel es de la empresa, no de la persona: lo define el cuestionario una
 * sola vez y vale para todos sus usuarios. Guardarlo en users/{uid} hacia que
 * cada usuario nuevo creado antes de responderlo volviera a verlo, y que dos
 * personas de la misma empresa pudieran contestar cosas distintas.
 *
 * Se mira primero Empresas/{nit} y, si aun no lo tiene, el documento del
 * usuario: es donde vivia hasta ahora y hay cuentas que solo lo tienen ahi.
 *
 * Devuelve `undefined` cuando no se pudo leer, que no es lo mismo que "el
 * onboarding está pendiente": ante un fallo de red los guards dejan pasar en
 * lugar de rebotar al usuario entre /admin y /starting.
 */
async function leerNivelAcceso(
  firestore: FirestoreService,
  uid: string,
  nit: string | null
): Promise<string | undefined> {
  if (nit) {
    try {
      const empresa = await firestore.getDocument<{ nivelAcceso?: string }>('Empresas/' + nit);
      const nivel = empresa.data()?.nivelAcceso;
      if (nivel) return nivel;
    } catch (error: unknown) {
      console.error('[Guard] leerNivelAcceso (empresa):', error);
    }
  }

  try {
    const snap = await firestore.getDocument<Models.Users.Usuario>('users/' + uid);
    return snap.data()?.nivelAcceso;
  } catch (error: unknown) {
    console.error('[Guard] leerNivelAcceso (usuario):', error);
    return undefined;
  }
}

/**
 * Protege las rutas que exigen sesión.
 * Espera a que Firebase resuelva el estado de autenticación antes de decidir,
 * para no expulsar al usuario en una recarga en frío.
 */
export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthenticacionService);
  const router = inject(Router);

  const userId = await auth.waitForUser();

  if (userId) return true;

  router.navigate([RUTA_LOGIN]);
  return false;
};

/**
 * Exige haber completado el onboarding para entrar al admin.
 *
 * Sin esto bastaba con tener sesión abierta: desde /starting el botón "atrás"
 * del navegador llevaba al dashboard, y la aplicación quedaba usándose sin
 * nivel definido, que es de donde sale qué pasos del PESV son exigibles.
 */
export const onboardingGuard: CanActivateFn = async () => {
  const auth = inject(AuthenticacionService);
  const firestore = inject(FirestoreService);
  const router = inject(Router);

  const uid = await auth.waitForUser();
  if (!uid) {
    router.navigate([RUTA_LOGIN]);
    return false;
  }

  // El superadministrador no pertenece a ninguna empresa ni tiene ficha en
  // users/, asi que la comprobacion de abajo lo dejaba pasar por no encontrar
  // nada. Su sitio es el panel de administracion.
  if (await auth.esSuperadmin()) {
    router.navigate(['/superadmin']);
    return false;
  }

  const nit = auth.getCurrentUser()?.displayName ?? null;
  if (await leerNivelAcceso(firestore, uid, nit) === SIN_NIVEL) {
    router.navigate([RUTA_ONBOARDING]);
    return false;
  }
  return true;
};

/**
 * Inverso del anterior: quien ya tiene nivel no vuelve al cuestionario.
 * Si no se pudo leer el nivel deja pasar, para no cruzar redirecciones con
 * onboardingGuard ante un fallo de lectura.
 */
export const onboardingCompletadoGuard: CanActivateFn = async () => {
  const auth = inject(AuthenticacionService);
  const firestore = inject(FirestoreService);
  const router = inject(Router);

  const uid = await auth.waitForUser();
  if (!uid) {
    router.navigate([RUTA_LOGIN]);
    return false;
  }

  const nit = auth.getCurrentUser()?.displayName ?? null;
  const nivel = await leerNivelAcceso(firestore, uid, nit);
  if (nivel && nivel !== SIN_NIVEL) {
    router.navigate([RUTA_INICIO]);
    return false;
  }
  return true;
};

/**
 * Reserva una ruta al superadministrador.
 *
 * Comprueba el claim `rol`, que solo escribe el Admin SDK desde la Cloud
 * Function. Aun así, la interfaz es la última defensa y no la primera: las
 * funciones que sirven datos de administración validan el permiso por su
 * cuenta, porque un guard solo decide qué se pinta.
 */
export const superadminGuard: CanActivateFn = async () => {
  const auth = inject(AuthenticacionService);
  const router = inject(Router);

  const uid = await auth.waitForUser();
  if (!uid) {
    router.navigate([RUTA_LOGIN]);
    return false;
  }

  const user = auth.getCurrentUser();
  const token = await user?.getIdTokenResult();

  if (token?.claims['rol'] === 'superadmin') return true;

  router.navigate([RUTA_INICIO]);
  return false;
};

/**
 * Inverso del anterior: impide que alguien con sesión abierta vuelva a ver
 * el formulario de acceso o el de registro.
 */
export const invitadoGuard: CanActivateFn = async () => {
  const auth = inject(AuthenticacionService);
  const router = inject(Router);

  const userId = await auth.waitForUser();

  if (!userId) return true;

  router.navigate([RUTA_INICIO]);
  return false;
};
