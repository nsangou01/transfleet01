import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private auth   = inject(AuthService);
  private router = inject(Router);

  email    = '';
  password = '';
  loading  = signal(false);
  error    = signal('');
  showPw   = signal(false);

  fillDemo(role: 'manager' | 'driver'): void {
    this.email    = role === 'manager' ? 'manager@transimex.cm' : 'jbnkomo@transimex.cm';
    this.password = 'password123';
    this.error.set('');
  }

  onSubmit(): void {
    if (!this.email || !this.password) {
      this.error.set('Veuillez renseigner tous les champs.');
      return;
    }
    this.loading.set(true);
    this.error.set('');

    this.auth.login(this.email.trim(), this.password).subscribe({
      next: () => {
        // La redirection est gérée par AuthService selon le rôle
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'Identifiants incorrects. Réessayez.');
        this.loading.set(false);
      },
    });
  }
}
