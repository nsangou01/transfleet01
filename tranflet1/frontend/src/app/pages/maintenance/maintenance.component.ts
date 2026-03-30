import { Component, inject, signal, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ApiService } from "../../core/services/api.service";
import { Maintenance, Vehicle } from "../../core/models";

@Component({
  selector: "app-maintenance", standalone: true, imports: [CommonModule, FormsModule],
  templateUrl: './maintenance.component.html',
  styleUrl: "./maintenance.component.scss",
})
export class MaintenanceComponent implements OnInit {
  private api = inject(ApiService);
  records = signal<Maintenance[]>([]); total = signal(0); vehicles = signal<Vehicle[]>([]);
  loading = signal(false); showModal = signal(false); saving = signal(false);
  formError = signal(""); editing = signal<Maintenance | null>(null);
  filterStatus = ""; form: Record<string,any> = this.emptyForm();

  ngOnInit() { this.load(); }
  load(): void {
    this.loading.set(true);
    const q: Record<string,any> = { limit: 100 };
    if (this.filterStatus) q["status"] = this.filterStatus;
    this.api.getMaintenance(q).subscribe({ next: r => { this.records.set(r.data); this.total.set(r.total); this.loading.set(false); }, error: () => this.loading.set(false) });
  }
  openModal(m?: Maintenance): void {
    this.editing.set(m ?? null);
    this.form = m ? { ...m } : this.emptyForm();
    this.formError.set(""); this.showModal.set(true);
    this.api.getVehicles({ limit: 100 }).subscribe(r => this.vehicles.set(r.data));
  }
  closeModal(): void { this.showModal.set(false); this.editing.set(null); }
  save(): void {
    if (!this.form["vehicle_id"] || !this.form["description"] || !this.form["scheduled_date"]) { this.formError.set("Champs obligatoires manquants."); return; }
    this.saving.set(true);
    const obs = this.editing() ? this.api.updateMaintenance(this.editing()!.id, this.form) : this.api.createMaintenance(this.form);
    obs.subscribe({ next: () => { this.closeModal(); this.load(); this.saving.set(false); }, error: (e:any) => { this.formError.set(e?.error?.message || "Erreur"); this.saving.set(false); } });
  }
  del(m: Maintenance): void {
    if (confirm("Supprimer cette maintenance ?")) this.api.deleteMaintenance(m.id).subscribe({ next: () => this.load(), error: (e:any) => alert(e?.error?.message || "Erreur") });
  }
  emptyForm() { return { vehicle_id:"", type:"routine", description:"", scheduled_date:"", status:"scheduled", estimated_cost: null, actual_cost: null, provider:"", provider_phone:"", completed_date:"", notes:"" }; }
  statusLabel(s: string) { return ({scheduled:"Planifié",in_progress:"En cours",completed:"Terminé",cancelled:"Annulé"})[s as keyof object] ?? s; }
  typeLabel(t: string) { return ({routine:"Routine",repair:"Réparation",inspection:"Inspection",emergency:"Urgence"})[t as keyof object] ?? t; }
}
