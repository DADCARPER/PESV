import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthenticacionService } from '../services/shared/authenticacion.service';

export const authGuard: CanActivateFn = async(route, state) => {
  const loginService = inject(AuthenticacionService);
  const router = inject(Router);

  const userId = await loginService.waitForUser();

  if (userId) {
    return true;
  } else {
    router.navigate(['/login']);
    return false;
  }
  
};