import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthenticacionService } from '../services/shared/authenticacion.service';

/** Ruta única del formulario de acceso. Cualquier redirección de sesión apunta aquí. */
export const RUTA_LOGIN = '/auth/login';

/** Ruta a la que llega un usuario ya autenticado. */
export const RUTA_INICIO = '/admin/dashboard';

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
