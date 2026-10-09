import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { User, UserDraft } from './models';

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);

  me(): Observable<User> {
    return this.http.get<User>('/api/me');
  }

  list(delayMs = 0): Observable<User[]> {
    const params = new HttpParams().set('delay', delayMs);
    return this.http.get<User[]>('/api/users', { params });
  }

  create(draft: UserDraft): Observable<User> {
    return this.http.post<User>('/api/users', this.clean(draft));
  }

  update(id: string, draft: UserDraft): Observable<User> {
    return this.http.put<User>(`/api/users/${id}`, this.clean(draft));
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`/api/users/${id}`);
  }

  // An empty password is dropped, so editing a user does not reset their password.
  private clean(draft: UserDraft): UserDraft {
    const { password, ...rest } = draft;
    return password ? { ...rest, password } : rest;
  }
}