import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { Vehicle, VehicleStatus, FuelType } from '../../core/models';

@Component({
  selector: 'app-vehicles',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './vehicles.component.html',
  styleUrl: './vehicles.component.scss',
})
export class VehiclesComponent implements OnInit {
  private api = inject(ApiService);

  vehicles     = signal<Vehicle[]>([]);
  total        = signal(0);
  loading      = signal(false);
  showModal    = signal(false);
  saving       = signal(false);
  formError    = signal('');
  editing      = signal<Vehicle | null>(null);
  search       = '';
  filterStatus = '';

  form: Partial<Vehicle> = this.emptyForm();

  ngOnInit() { this.load(); }

  load(): void {
    this.loading.set(true);
    const q: Record<string,any> = { limit: 100 };
    if (this.search.trim()) q['search'] = this.search.trim();
    if (this.filterStatus) q['status'] = this.filterStatus;
    this.api.getVehicles(q).subscribe({
      next: r => { this.vehicles.set(r.data); this.total.set(r.total); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openModal(v?: Vehicle): void {
    this.editing.set(v ?? null);
    this.form = v ? { ...v } : this.emptyForm();
    this.formError.set('');
    this.showModal.set(true);
  }

  closeModal(): void { this.showModal.set(false); this.editing.set(null); }

  save(): void {
    if (!this.form.plate || !this.form.brand || !this.form.model || !this.form.year) {
      this.formError.set('Veuillez remplir tous les champs obligatoires (*).');
      return;
    }
    this.saving.set(true);
    const obs = this.editing()
      ? this.api.updateVehicle(this.editing()!.id, this.form)
      : this.api.createVehicle(this.form);

    obs.subscribe({
      next: () => { this.closeModal(); this.load(); this.saving.set(false); },
      error: (e) => { this.formError.set(e?.error?.message || 'Erreur'); this.saving.set(false); },
    });
  }

  confirmDelete(v: Vehicle): void {
    if (confirm(`Supprimer le véhicule ${v.plate} (${v.brand} ${v.model}) ?`)) {
      this.api.deleteVehicle(v.id).subscribe({
        next: () => this.load(),
        error: (e) => alert(e?.error?.message || 'Erreur de suppression'),
      });
    }
  }

  emptyForm(): Partial<Vehicle> {
    return { plate: '', brand: '', model: '', year: new Date().getFullYear(), fuel_type: 'diesel', capacity: 5, mileage: 0, color: '' };
  }

  statusLabel(s: VehicleStatus): string {
    return ({ available:'Disponible', in_use:'En route', maintenance:'Maintenance', out_of_service:'Hors service' })[s] ?? s;
  }
  fuelLabel(f: FuelType): string {
    return ({ diesel:'Diesel', gasoline:'Essence', hybrid:'Hybride', electric:'Électrique' })[f] ?? f;
  }
}
