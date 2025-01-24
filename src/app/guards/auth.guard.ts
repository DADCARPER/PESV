import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { LoginService } from '../services/login.service';

export const authGuard: CanActivateFn = (route, state) => {
  const loginService = inject(LoginService);
  const router = inject(Router);

  return new Promise<boolean>((resolve) => {
    const subscription = loginService.user$.subscribe({
      next: (user) => {
        subscription.unsubscribe(); // Nos desuscribimos de forma segura
        if (user) {
          resolve(true);
        } else {
          router.navigate(['/login']);
          resolve(false);
        }
      },
      error: (error) => {
        console.error('Error en el guard:', error);
        router.navigate(['/login']);
        resolve(false);
      }
    });
  });
};