import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const token = auth.token();
  const outgoing = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(outgoing).pipe(
    tap({
      error: (error: HttpErrorResponse) => {
        const isLoginCall = req.url.includes('/auth/login');
        if (error.status === 401 && !isLoginCall) {
          auth.logout();
          router.navigateByUrl('/login');
        }
      }
    })
  );
};