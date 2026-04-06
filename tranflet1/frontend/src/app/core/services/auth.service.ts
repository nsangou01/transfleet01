import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../models';

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

  // Utilisation des clés constantes pour le LocalStorage
  private readonly TOKEN_KEY = 'moni_token';
  private readonly USER_KEY  = 'moni_user';

  private _user = signal<User | null>(this.loadUser());
  readonly currentUser  = this._user.asReadonly();
  readonly isLoggedIn   = computed(() => !!this._user());
  readonly isManager    = computed(() => ['manager','admin'].includes(this._user()?.role ?? ''));
  readonly isDriver     = computed(() => this._user()?.role === 'driver');
  readonly passwordIsDefault = computed(() => this._user()?.passwordIsDefault ?? false);

  private loadUser(): User | null {
    try {
      const savedUser = localStorage.getItem(this.USER_KEY);
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  }

  login(email: string, password: string): Observable<ApiLoginResponse> {
    return this.http.post<ApiLoginResponse>(`${this.api}/login`, { email, password }).pipe(
      tap(res => {
        // Mapping manuel pour s'assurer que les noms correspondent à ton interface User.ts
        const user: User = {
          id: res.user.id,
          firstName: res.user.first_name,
          lastName: res.user.last_name,
          email: res.user.email,
          role: res.user.role,
          phone: res.user.phone,
          driverId: res.user.driver_id,
          passwordIsDefault: res.user.password_is_default || false
        };

        // Stockage
        localStorage.setItem(this.TOKEN_KEY, res.token);
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));

        // Mise à jour de l'état
        this._user.set(user);

        // Redirection intelligente
        if (user.role === 'driver') {
          this.router.navigate(['/trips']);
        } else {
          this.router.navigate(['/dashboard']);
        }
      })
    );
  }

  /**
   * MÉTHODE CORRIGÉE : Indispensable pour ton composant force-password-change
   */
  changePassword(current_password: string, new_password: string): Observable<any> {
    return this.http.put(`${this.api}/password`, { current_password, new_password }).pipe(
      tap(() => {
        const u = this._user();
        if (u) {
          // On met à jour l'utilisateur localement pour dire que le MDP n'est plus par défaut
          const updatedUser: User = { ...u, passwordIsDefault: false };
          localStorage.setItem(this.USER_KEY, JSON.stringify(updatedUser));
          this._user.set(updatedUser);
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this._user.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  me(): Observable<User> {
    return this.http.get<User>(`${this.api}/me`).pipe(
      tap(u => {
        localStorage.setItem(this.USER_KEY, JSON.stringify(u));
        this._user.set(u);
      })
    );
  }

  updateProfile(data: Partial<User>): Observable<any> {
    return this.http.put(`${this.api}/profile`, data).pipe(
      tap(() => {
        const current = this._user();
        if (current) {
          const updated = { ...current, ...data };
          localStorage.setItem(this.USER_KEY, JSON.stringify(updated));
          this._user.set(updated);
        }
      })
    );
  }
}