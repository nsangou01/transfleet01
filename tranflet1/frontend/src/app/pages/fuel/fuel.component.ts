import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ApiService } from "../../core/services/api.service";
import { FuelRecord, Vehicle, Driver } from "../../core/models";

@Component({
  selector: "app-fuel", standalone: true, imports: [CommonModule, FormsModule],
  templateUrl: './fuel.component.html',
  styleUrl: "./fuel.component.scss",
})
export class FuelComponent implements OnInit {
  private api = inject(ApiService);
  records = signal<FuelRecord[]>([]); total = signal(0);
  vehicles = signal<Vehicle[]>([]); drivers = signal<Driver[]>([]);
  loading = signal(false); showModal = signal(false); saving = signal(false);
  formError = signal(""); editing = signal<FuelRecord | null>(null);
  form: Record<string,any> = this.emptyForm();
  totalCost = signal(0); totalQty = signal(0);

  ngOnInit() { this.load(); }
  load(): void {
    this.loading.set(true);
    this.api.getFuel({ limit: 100 }).subscribe({ next: r => {
      this.records.set(r.data); this.total.set(r.total);
      this.totalCost.set(r.data.reduce((s: number, f: FuelRecord) => s + +f.total_cost, 0));
      this.totalQty.set(Math.round(r.data.reduce((s: number, f: FuelRecord) => s + +f.quantity, 0)));
      this.loading.set(false);
    }, error: () => this.loading.set(false) });
  }
  openModal(f?: FuelRecord): void {
    this.editing.set(f ?? null);
    this.form = f ? { ...f } : this.emptyForm();
    this.formError.set(""); this.showModal.set(true);
    this.api.getVehicles({ limit:100 }).subscribe(r => this.vehicles.set(r.data));
    this.api.getDrivers({ limit:100 }).subscribe(r => this.drivers.set(r.data));
  }
  closeModal(): void { this.showModal.set(false); this.editing.set(null); }
  calcTotal(): void { if (this.form["quantity"] && this.form["price_per_litre"]) this.form["total_cost"] = Math.round(+this.form["quantity"] * +this.form["price_per_litre"]); }
  save(): void {
    if (!this.form["vehicle_id"] || !this.form["driver_id"] || !this.form["quantity"] || !this.form["price_per_litre"] || !this.form["date"]) { this.formError.set("Champs obligatoires manquants."); return; }
    this.saving.set(true);
    const obs = this.editing() ? this.api.updateFuel(this.editing()!.id, this.form) : this.api.createFuel(this.form);
    obs.subscribe({ next: () => { this.closeModal(); this.load(); this.saving.set(false); }, error: (e:any) => { this.formError.set(e?.error?.message || "Erreur"); this.saving.set(false); } });
  }
  del(f: FuelRecord): void {
    if (confirm("Supprimer cet enregistrement ?")) this.api.deleteFuel(f.id).subscribe({ next: () => this.load(), error: (e:any) => alert(e?.error?.message || "Erreur") });
  }
  emptyForm() { return { vehicle_id:"", driver_id:"", date: new Date().toISOString().split("T")[0], quantity: null, price_per_litre: 750, total_cost: null, fuel_type:"diesel", station_name:"", station_city:"", mileage_at_fill: null, notes:"" }; }
}
