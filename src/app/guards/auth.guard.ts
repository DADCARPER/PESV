import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { Auth, onAuthStateChanged  } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(Auth);
  const router = inject(Router);

  return new Observable<boolean>(subscriber => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        subscriber.next(true); // Usuario autenticado
        subscriber.complete();
      } else {
        router.navigate(['/login']); // Redirigir al login si no está autenticado
        subscriber.next(false);
        subscriber.complete();
      }
    });
  });

};