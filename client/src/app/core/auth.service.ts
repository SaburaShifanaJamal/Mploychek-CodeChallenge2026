import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { LoginRequest, LoginResponse, User } from './models';

const TOKEN_KEY = 'casefile.token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);

  readonly token = signal<string | null>(sessionStorage.getItem(TOKEN_KEY));
  readonly user = signal<User | null>(null);

  readonly isLoggedIn = computed(() => !!this.token() && !!this.user());
  readonly isAdmin = computed(() => this.user()?.role === 'Admin');

  login(request: LoginRequest): Observable<User> {
    return this.http.post<LoginResponse>('/api/auth/login', request).pipe(
      tap(res => {
        sessionStorage.setItem(TOKEN_KEY, res.token);
        this.token.set(res.token);
        this.user.set(res.user);
      }),
      map(res => res.user)
    );
  }

  restoreSession(): Observable<User | null> {
    if (!this.token()) return of(null);
    return this.http.get<User>('/api/me').pipe(
      tap(user => this.user.set(user)),
      catchError(() => {
        this.logout();
        return of(null);
      })
    );
  }

  logout(): void {
    sessionStorage.removeItem(TOKEN_KEY);
    this.token.set(null);
    this.user.set(null);
  }
}