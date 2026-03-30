import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Gestion des utilisateurs</h1>
          <p class="subtitle">Administrateurs, Managers et Chauffeurs</p>
        </div>
      </div>

      <div class="tabs">
        <button [class.active]="activeTab === 'managers'" (click)="activeTab = 'managers'">Managers</button>
        <button [class.active]="activeTab === 'drivers'" (click)="activeTab = 'drivers'">Chauffeurs</button>
      </div>

      <div class="actions-bar">
        <button class="btn btn-primary" (click)="activeTab === 'managers' ? showManagerModal = true : showDriverModal = true">
          + Ajouter {{ activeTab === 'managers' ? 'un manager' : 'un chauffeur' }}
        </button>
      </div>

      @if (loading()) {
        <div class="loading-state">Chargement...</div>
      } @else {
        <div class="table-card">
          <table>
            <thead>
              <tr><th>Nom</th><th>Email</th><th>Téléphone</th><th>Rôle</th><th>Statut</th><th>Actions</th></tr>
            </thead>
            <tbody>
              @for (u of filteredUsers(); track u.id) {
                <tr>
                  <td><strong>{{ u.first_name }} {{ u.last_name }}</strong></td>
                  <td>{{ u.email }}</td>
                  <td>{{ u.phone ?? '—' }}</td>
                  <td>{{ roleLabel(u.role) }}</td>
                  <td><span class="badge" [class.active]="u.is_active" [class.inactive]="!u.is_active">{{ u.is_active ? 'Actif' : 'Inactif' }}</span></td>
                  <td class="actions">
                    <button class="btn-icon-sm" (click)="toggleActive(u)">{{ u.is_active ? 'Désactiver' : 'Activer' }}</button>
                    <button class="btn-icon-sm danger" (click)="deleteUser(u)">Supprimer</button>
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="6" class="empty">Aucun utilisateur trouvé.</td></tr>
              }
            </tbody>
          </table>
        </div>
      }

      @if (showManagerModal) {
        <div class="modal-backdrop" (click)="showManagerModal = false">
          <div class="modal" (click)="$event.stopPropagation()">
            <div class="modal-header"><h2>Nouveau Manager</h2><button class="modal-close" (click)="showManagerModal = false">×</button></div>
            <div class="modal-body">
              @if (formError()) { <div class="alert-error">{{ formError() }}</div> }
              <div class="form-grid">
                <div class="field"><label>Prénom *</label><input [(ngModel)]="managerForm.first_name" /></div>
                <div class="field"><label>Nom *</label><input [(ngModel)]="managerForm.last_name" /></div>
                <div class="field"><label>Email *</label><input type="email" [(ngModel)]="managerForm.email" /></div>
                <div class="field"><label>Téléphone</label><input [(ngModel)]="managerForm.phone" /></div>
                <div class="field"><label>Mot de passe *</label><input type="password" [(ngModel)]="managerForm.password" /></div>
                <div class="field"><label>Confirmer *</label><input type="password" [(ngModel)]="managerForm.confirmPassword" /></div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="showManagerModal = false">Annuler</button>
              <button class="btn btn-primary" (click)="createManager()" [disabled]="creating()">{{ creating() ? 'Création...' : 'Créer' }}</button>
            </div>
          </div>
        </div>
      }

      @if (showDriverModal) {
        <div class="modal-backdrop" (click)="showDriverModal = false">
          <div class="modal" (click)="$event.stopPropagation()">
            <div class="modal-header"><h2>Nouveau Chauffeur</h2><button class="modal-close" (click)="showDriverModal = false">×</button></div>
            <div class="modal-body">
              @if (formError()) { <div class="alert-error">{{ formError() }}</div> }
              <div class="form-grid">
                <div class="field"><label>Prénom *</label><input [(ngModel)]="driverForm.first_name" /></div>
                <div class="field"><label>Nom *</label><input [(ngModel)]="driverForm.last_name" /></div>
                <div class="field"><label>Email *</label><input type="email" [(ngModel)]="driverForm.email" /></div>
                <div class="field"><label>Téléphone</label><input [(ngModel)]="driverForm.phone" /></div>
                <div class="field"><label>Mot de passe *</label><input type="password" [(ngModel)]="driverForm.password" /></div>
                <div class="field"><label>Confirmer *</label><input type="password" [(ngModel)]="driverForm.confirmPassword" /></div>
                <div class="field"><label>N° Permis *</label><input [(ngModel)]="driverForm.license_number" /></div>
                <div class="field"><label>Catégorie</label><input [(ngModel)]="driverForm.license_category" placeholder="B, C..." /></div>
                <div class="field"><label>Expiration *</label><input type="date" [(ngModel)]="driverForm.license_expiry" /></div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="showDriverModal = false">Annuler</button>
              <button class="btn btn-primary" (click)="createDriver()" [disabled]="creating()">{{ creating() ? 'Création...' : 'Créer' }}</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .tabs { display: flex; gap: 8px; margin-bottom: 20px; border-bottom: 2px solid #e5e7eb; }
    .tabs button { padding: 12px 24px; border: none; background: transparent; cursor: pointer; font-weight: 500; color: #6b7280; border-bottom: 2px solid transparent; margin-bottom: -2px; }
    .tabs button.active { color: #0284c7; border-bottom-color: #0284c7; }
    .actions-bar { margin-bottom: 20px; }
    .badge { padding: 4px 12px; border-radius: 99px; font-size: .75rem; font-weight: 500; }
    .badge.active { background: #d1fae5; color: #065f46; }
    .badge.inactive { background: #fee2e2; color: #991b1b; }
    .alert-error { background: #fee2e2; color: #dc2626; padding: 12px; border-radius: 8px; margin-bottom: 16px; }
  `]
})
export class UsersComponent implements OnInit {
  private api = inject(ApiService);

  users = signal<any[]>([]);
  loading = signal(false);
  creating = signal(false);
  formError = signal('');

  managerForm: Record<string, any> = {
    first_name: '', last_name: '', email: '', phone: '', password: '', confirmPassword: ''
  };

  driverForm: Record<string, any> = {
    first_name: '', last_name: '', email: '', phone: '', password: '', confirmPassword: '',
    license_number: '', license_category: 'B', license_expiry: ''
  };

  activeTab: 'managers' | 'drivers' = 'managers';
  showManagerModal = false;
  showDriverModal = false;

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.loading.set(true);
    this.api.getUsers().subscribe({
      next: (data) => {
        this.users.set(data);
        this.loading.set(false);
      },
      error: (err: any) => {
        this.formError.set('Erreur lors du chargement des utilisateurs');
        this.loading.set(false);
      }
    });
  }

  createManager(): void {
    this.formError.set('');
    if (this.managerForm.password !== this.managerForm.confirmPassword) {
      this.formError.set('Les mots de passe ne correspondent pas');
      return;
    }
    if (this.managerForm.password.length < 8) {
      this.formError.set('Le mot de passe doit faire au moins 8 caractères');
      return;
    }

    this.creating.set(true);
    const { confirmPassword, ...data } = this.managerForm;
    
    this.api.createManager(data).subscribe({
      next: () => {
        alert('Manager créé avec succès');
        this.showManagerModal = false;
        this.resetManagerForm();
        this.loadUsers();
        this.creating.set(false);
      },
      error: (err: any) => {
        this.formError.set(err.error?.message || 'Erreur lors de la création du manager');
        this.creating.set(false);
      }
    });
  }

  createDriver(): void {
    this.formError.set('');
    if (this.driverForm.password !== this.driverForm.confirmPassword) {
      this.formError.set('Les mots de passe ne correspondent pas');
      return;
    }
    if (this.driverForm.password.length < 8) {
      this.formError.set('Le mot de passe doit faire au moins 8 caractères');
      return;
    }

    this.creating.set(true);
    const { confirmPassword, ...data } = this.driverForm;
    
    this.api.createDriverUser(data).subscribe({
      next: () => {
        alert('Chauffeur créé avec succès');
        this.showDriverModal = false;
        this.resetDriverForm();
        this.loadUsers();
        this.creating.set(false);
      },
      error: (err: any) => {
        this.formError.set(err.error?.message || 'Erreur lors de la création du chauffeur');
        this.creating.set(false);
      }
    });
  }

  toggleActive(user: any): void {
    this.api.toggleUserActive(user.id).subscribe({
      next: () => {
        alert(`Utilisateur ${user.is_active ? 'désactivé' : 'activé'}`);
        this.loadUsers();
      },
      error: (err: any) => {
        alert(err.error?.message || 'Erreur lors du changement de statut');
      }
    });
  }

  deleteUser(user: any): void {
    if (!confirm(`Supprimer définitivement ${user.first_name} ${user.last_name} ?`)) return;
    
    this.api.deleteUser(user.id).subscribe({
      next: () => {
        alert('Utilisateur supprimé');
        this.loadUsers();
      },
      error: (err: any) => {
        alert(err.error?.message || 'Erreur lors de la suppression');
      }
    });
  }

  resetManagerForm() {
    this.managerForm = {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: ''
    };
  }

  resetDriverForm() {
    this.driverForm = {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      license_number: '',
      license_category: 'B',
      license_expiry: ''
    };
  }

  get filteredUsers(): any[] {
    const role = this.activeTab === 'managers' ? 'manager' : 'driver';
    return this.users().filter((u: any) => u.role === role);
  }

  roleLabel(role: string): string {
    const labels: Record<string, string> = { admin: 'Administrateur', manager: 'Manager', driver: 'Chauffeur' };
    return labels[role] || role;
  }
}
