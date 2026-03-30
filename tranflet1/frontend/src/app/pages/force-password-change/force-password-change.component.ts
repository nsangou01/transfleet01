import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-force-password-change',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="force-password-page">
      <div class="force-password-card">
        <div class="icon-lock">🔒</div>
        <h1>Changement de mot de passe requis</h1>
        <p class="subtitle">
          Pour des raisons de sécurité, vous devez changer votre mot de passe avant de continuer.
        </p>

        <form (ngSubmit)="onSubmit()" #form="ngForm">
          <div class="form-group">
            <label>Mot de passe actuel</label>
            <input
              type="password"
              [(ngModel)]="currentPassword"
              name="currentPassword"
              required
              placeholder="Entrez votre mot de passe actuel"
            />
          </div>

          <div class="form-group">
            <label>Nouveau mot de passe</label>
            <input
              type="password"
              [(ngModel)]="newPassword"
              name="newPassword"
              required
              minlength="8"
              placeholder="Min. 8 caractères"
            />
            <span class="hint">Minimum 8 caractères</span>
          </div>

          <div class="form-group">
            <label>Confirmer le nouveau mot de passe</label>
            <input
              type="password"
              [(ngModel)]="confirmPassword"
              name="confirmPassword"
              required
              placeholder="Répétez le nouveau mot de passe"
            />
          </div>

          <div *ngIf="errorMessage()" class="error-message">
            {{ errorMessage() }}
          </div>

          <button
            type="submit"
            class="btn btn-primary btn-block"
            [disabled]="saving() || !form.valid"
          >
            <span *ngIf="saving()">Enregistrement...</span>
            <span *ngIf="!saving()">Changer le mot de passe</span>
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .force-password-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      padding: 20px;
    }
    .force-password-card {
      background: #fff;
      border-radius: 16px;
      padding: 40px;
      width: 100%;
      max-width: 420px;
      box-shadow: 0 20px 60px rgba(0,0,0,.3);
      text-align: center;
    }
    .icon-lock {
      font-size: 48px;
      margin-bottom: 16px;
    }
    h1 {
      font-size: 1.5rem;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 8px;
    }
    .subtitle {
      color: #64748b;
      font-size: .875rem;
      margin-bottom: 24px;
      line-height: 1.5;
    }
    .form-group {
      text-align: left;
      margin-bottom: 16px;
    }
    label {
      display: block;
      font-size: .875rem;
      font-weight: 500;
      color: #374151;
      margin-bottom: 6px;
    }
    input {
      width: 100%;
      padding: 12px 16px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: .875rem;
      transition: border-color .15s;
    }
    input:focus {
      outline: none;
      border-color: #38bdf8;
      box-shadow: 0 0 0 3px rgba(56,189,248,.1);
    }
    .hint {
      font-size: .75rem;
      color: #9ca3af;
      margin-top: 4px;
    }
    .error-message {
      background: #fef2f2;
      color: #dc2626;
      padding: 12px;
      border-radius: 8px;
      font-size: .875rem;
      margin-bottom: 16px;
    }
    .btn {
      width: 100%;
      padding: 12px 24px;
      border: none;
      border-radius: 8px;
      font-size: .875rem;
      font-weight: 600;
      cursor: pointer;
      transition: all .15s;
    }
    .btn-primary {
      background: #0284c7;
      color: #fff;
    }
    .btn-primary:hover:not(:disabled) {
      background: #0369a1;
    }
    .btn:disabled {
      opacity: .6;
      cursor: not-allowed;
    }
  `]
})
export class ForcePasswordChangeComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  errorMessage = signal('');
  saving = signal(false);

  onSubmit(): void {
    this.errorMessage.set('');

    // Validation
    if (this.newPassword.length < 8) {
      this.errorMessage.set('Le nouveau mot de passe doit faire au moins 8 caractères');
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage.set('Les mots de passe ne correspondent pas');
      return;
    }

    this.saving.set(true);
    this.auth.changePassword(this.currentPassword, this.newPassword).subscribe({
      next: () => {
        alert('Mot de passe modifié avec succès !');
        // Redirection selon le rôle
        const user = this.auth.currentUser();
        if (user?.role === 'driver') {
          this.router.navigate(['/trips']);
        } else {
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err: any) => {
        this.errorMessage.set(err.error?.message || 'Erreur lors du changement de mot de passe');
        this.saving.set(false);
      }
    });
  }
}
