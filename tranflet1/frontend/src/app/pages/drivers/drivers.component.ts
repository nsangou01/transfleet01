import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { Driver } from '../../core/models';

@Component({
  selector: 'app-drivers', standalone: true, imports: [CommonModule, FormsModule],
  templateUrl: './drivers.component.html',
  styleUrl: './drivers.component.scss',
})
export class DriversComponent implements OnInit {
  private api = inject(ApiService);
  drivers = signal<Driver[]>([]); total = signal(0);
  loading = signal(false); showModal = signal(false); saving = signal(false);
  formError = signal(''); editing = signal<Driver | null>(null);
  search = ''; filterStatus = '';
  form: Record<string,any> = this.emptyForm();

  ngOnInit() { this.load(); }
  load(): void {
    this.loading.set(true);
    const q: Record<string,any> = { limit: 100 };
    if (this.search.trim()) q['search'] = this.search.trim();
    if (this.filterStatus) q['status'] = this.filterStatus;
    this.api.getDrivers(q).subscribe({ next: r => { this.drivers.set(r.data); this.total.set(r.total); this.loading.set(false); }, error: () => this.loading.set(false) });
  }
  openModal(d?: Driver): void {
    this.editing.set(d ?? null);
    this.form = d ? { first_name: d.user?.first_name, last_name: d.user?.last_name, email: d.user?.email, phone: d.user?.phone, license_number: d.license_number, license_category: d.license_category, license_expiry: d.license_expiry, experience_years: d.experience_years, emergency_contact: d.emergency_contact, emergency_phone: d.emergency_phone, status: d.status } : this.emptyForm();
    this.formError.set(''); this.showModal.set(true);
  }
  closeModal(): void { this.showModal.set(false); this.editing.set(null); }
  save(): void {
    if (!this.form['first_name'] || !this.form['last_name'] || !this.form['license_number'] || !this.form['license_expiry']) { this.formError.set('Champs obligatoires manquants.'); return; }
    if (!this.editing() && !this.form['email']) { this.formError.set('Email obligatoire.'); return; }
    this.saving.set(true);
    const obs = this.editing() ? this.api.updateDriver(this.editing()!.id, this.form) : this.api.createDriver(this.form);
    obs.subscribe({ next: () => { this.closeModal(); this.load(); this.saving.set(false); }, error: (e: any) => { this.formError.set(e?.error?.message || 'Erreur'); this.saving.set(false); } });
  }
  confirmDelete(d: Driver): void {
    if (confirm(`Supprimer ${d.user?.first_name} ${d.user?.last_name} ?`)) {
      this.api.deleteDriver(d.id).subscribe({ next: () => this.load(), error: (e: any) => alert(e?.error?.message || 'Erreur') });
    }
  }

  resetPassword(d: Driver): void {
    const newPassword = prompt(`Nouveau mot de passe pour ${d.user?.first_name} ${d.user?.last_name} :\n\nMin. 8 caractères`);
    if (!newPassword) return;
    if (newPassword.length < 8) {
      alert('Le mot de passe doit faire au moins 8 caractères');
      return;
    }
    if (!confirm(`Confirmer la réinitialisation du mot de passe ?`)) return;
    
    this.api.resetUserPassword(d.user_id, newPassword).subscribe({
      next: () => {
        alert('Mot de passe réinitialisé avec succès !\n\nLe chauffeur devra changer son mot de passe à sa prochaine connexion.');
      },
      error: (e: any) => alert(e?.error?.message || 'Erreur lors de la réinitialisation')
    });
  }

  emptyForm() { return { first_name:'', last_name:'', email:'', phone:'', password:'password123', license_number:'', license_category:'B', license_expiry:'', experience_years:1, emergency_contact:'', emergency_phone:'' }; }
  statusLabel(s: string): string { return ({available:'Disponible',on_trip:'En mission',off_duty:'Hors service',suspended:'Suspendu'})[s as keyof object] ?? s; }
}
