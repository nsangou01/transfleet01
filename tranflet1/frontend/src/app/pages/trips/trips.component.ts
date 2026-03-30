import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { Trip, Vehicle, Driver } from '../../core/models';

@Component({
  selector: 'app-trips', standalone: true, imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './trips.component.html',
  styleUrl: './trips.component.scss',
})
export class TripsComponent implements OnInit {
  private api  = inject(ApiService);
  auth = inject(AuthService);
  isManager = this.auth.isManager;

  trips = signal<Trip[]>([]); total = signal(0);
  loading = signal(false); showModal = signal(false); showComplete = signal(false); saving = signal(false);
  formError = signal(''); selectedTrip = signal<Trip | null>(null);
  availVehicles = signal<Vehicle[]>([]); availDrivers = signal<Driver[]>([]);
  filterStatus = '';
  form: Record<string,any> = this.emptyForm();
  completeForm: Record<string,any> = { actual_distance: null, actual_duration: '', fuel_used: null, notes: '' };

  ngOnInit() { this.load(); }
  load(): void {
    this.loading.set(true);
    const q: Record<string,any> = { limit: 100 };
    if (this.filterStatus) q['status'] = this.filterStatus;
    this.api.getTrips(q).subscribe({ next: r => { this.trips.set(r.data); this.total.set(r.total); this.loading.set(false); }, error: () => this.loading.set(false) });
  }
  openModal(): void {
    this.form = this.emptyForm(); this.formError.set(''); this.showModal.set(true);
    this.api.getVehicles({ status:'available', limit:100 }).subscribe(r => this.availVehicles.set(r.data));
    this.api.getDrivers({ status:'available', limit:100 }).subscribe(r => this.availDrivers.set(r.data));
  }
  closeModal(): void { this.showModal.set(false); }
  save(): void {
    if (!this.form['vehicle_id'] || !this.form['driver_id'] || !this.form['from_location'] || !this.form['to_location']) { this.formError.set('Champs obligatoires manquants.'); return; }
    this.saving.set(true);
    this.api.createTrip(this.form).subscribe({ next: () => { this.closeModal(); this.load(); this.saving.set(false); }, error: (e:any) => { this.formError.set(e?.error?.message || 'Erreur'); this.saving.set(false); } });
  }
  startTrip(t: Trip): void {
    if (confirm(`Démarrer le trajet ${t.from_location} → ${t.to_location} ?`)) {
      this.api.startTrip(t.id).subscribe({ next: () => this.load(), error: (e:any) => alert(e?.error?.message || 'Erreur') });
    }
  }
  openComplete(t: Trip): void { this.selectedTrip.set(t); this.completeForm = { actual_distance: t.estimated_distance, actual_duration: t.estimated_duration, fuel_used: null, notes: '' }; this.showComplete.set(true); }
  completeTrip(): void {
    this.saving.set(true);
    this.api.completeTrip(this.selectedTrip()!.id, this.completeForm).subscribe({ next: () => { this.showComplete.set(false); this.load(); this.saving.set(false); }, error: (e:any) => { alert(e?.error?.message || 'Erreur'); this.saving.set(false); } });
  }
  cancelTrip(t: Trip): void {
    const reason = prompt("Raison de l'annulation (optionnel) :");
    if (reason !== null) this.api.cancelTrip(t.id, reason || undefined).subscribe({ next: () => this.load(), error: (e:any) => alert(e?.error?.message || 'Erreur') });
  }
  emptyForm() { return { vehicle_id:'', driver_id:'', from_location:'', to_location:'', estimated_distance: null, estimated_duration:'', purpose:'', passengers:0, scheduled_start:'', notes:'' }; }
  statusLabel(s: string): string { return ({planned:'Planifié',in_progress:'En cours',completed:'Terminé',cancelled:'Annulé'})[s as keyof object] ?? s; }
}
