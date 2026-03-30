import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, LoginResponse } from '../models';

interface ApiLoginResponse {
  token: string;
  user: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    role: 'admin' | 'manager' | 'driver';
    phone?: string;
    driver_id?: number | null;
    password_is_default?: boolean;
  };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http   = inject(HttpClient);
  private router = inject(Router);
  private api    = `${environment.apiUrl}/auth`;

  private _user = signal<User | null>(this.loadUser());
  readonly currentUser  = this._user.asReadonly();
  readonly isLoggedIn   = computed(() => !!this._user());
  readonly isManager    = computed(() => ['manager','admin'].includes(this._user()?.role ?? ''));
  readonly isDriver     = computed(() => this._user()?.role === 'driver');
  readonly passwordIsDefault = computed(() => this._user()?.passwordIsDefault ?? false);

  private loadUser(): User | null {
    try { return JSON.parse(localStorage.getItem('moni_user') || 'null'); } catch { return null; }
  }

  login(email: string, password: string): Observable<ApiLoginResponse> {
    return this.http.post<ApiLoginResponse>(`${this.api}/login`, { email, password }).pipe(
      tap(res => {
        // Mapper snake_case → camelCase
        const user: User = {
          id: res.user.id,
          firstName: res.user.first_name,
          lastName: res.user.last_name,
          email: res.user.email,
          role: res.user.role,
          phone: res.user.phone,
          driverId: res.user.driver_id,
          passwordIsDefault: res.user.password_is_default
        };
        localStorage.setItem('moni_token', res.token);
        localStorage.setItem('moni_user', JSON.stringify(user));
        this._user.set(user);
        // Redirection selon le rôle
        if (user.role === 'driver') {
          this.router.navigate(['/trips']);
        } else {
          this.router.navigate(['/dashboard']);
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem('moni_token');
    localStorage.removeItem('moni_user');
    this._user.set(null);
    this.router.navigate(['/login']);
  }

  me(): Observable<User> {
    return this.http.get<User>(`${this.api}/me`).pipe(
      tap(u => { localStorage.setItem('moni_user', JSON.stringify(u)); this._user.set(u); })
    );
  }

  updateProfile(data: Partial<User>): Observable<any> {
    return this.http.put(`${this.api}/profile`, data).pipe(
      tap(() => { const u = { ...this._user()!, ...data }; localStorage.setItem('moni_user', JSON.stringify(u)); this._user.set(u); })
    );
  }

  changePassword(current_password: string, new_password: string): Observable<any> {
    return this.http.put(`${this.api}/password`, { current_password, new_password }).pipe(
      tap(() => {
        // Mettre à jour le flag passwordIsDefault
        const u = this._user();
        if (u) {
          u.passwordIsDefault = false;
          localStorage.setItem('moni_user', JSON.stringify(u));
          this._user.set(u);
        }
      })
    );
  }

  getToken(): string | null { return localStorage.getItem('moni_token'); }
}
