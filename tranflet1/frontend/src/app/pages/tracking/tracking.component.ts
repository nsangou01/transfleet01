import { Component, inject, signal, OnInit, OnDestroy } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ApiService } from "../../core/services/api.service";
import { TrackingPoint, Vehicle } from "../../core/models";

interface VehicleStatus { vehicle: Vehicle; lastPosition: TrackingPoint | null }

@Component({
  selector: "app-tracking", standalone: true, imports: [CommonModule],
  templateUrl: './tracking.component.html',
  styleUrl: './tracking.component.scss',
})
export class TrackingComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);
  data = signal<VehicleStatus[]>([]);
  loading = signal(false);
  lastUpdate = signal("—");
  private timer: any;

  ngOnInit() { this.load(); this.timer = setInterval(() => this.load(), 30_000); }
  ngOnDestroy() { clearInterval(this.timer); }
  load(): void {
    this.loading.set(true);
    this.api.getTracking().subscribe({ next: r => { this.data.set(r); this.lastUpdate.set("Màj : " + new Date().toLocaleTimeString("fr-FR")); this.loading.set(false); }, error: () => this.loading.set(false) });
  }
  mapUrl(p: TrackingPoint): string { return `https://www.google.com/maps?q=${p.latitude},${p.longitude}`; }
  statusLabel(s: string): string { return ({available:"Disponible",in_use:"En route",maintenance:"Maintenance",out_of_service:"Hors service"})[s as keyof object] ?? s; }
}
