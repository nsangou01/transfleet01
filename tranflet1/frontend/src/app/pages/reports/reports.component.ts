import { Component, inject, signal, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ApiService } from "../../core/services/api.service";

@Component({
  selector: "app-reports", standalone: true, imports: [CommonModule, FormsModule],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss',
})
export class ReportsComponent implements OnInit {
  private api = inject(ApiService);
  report = signal<any>(null); loading = signal(false);
  start = ""; end = "";

  ngOnInit(): void {
    const now = new Date();
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    this.start = first.toISOString().split("T")[0];
    this.end   = now.toISOString().split("T")[0];
    this.load();
  }
  load(): void {
    this.loading.set(true);
    this.api.getFuelReport({ start: this.start, end: this.end }).subscribe({ next: r => { this.report.set(r); this.loading.set(false); }, error: () => this.loading.set(false) });
  }
  exportCsv(): void {
    const r = this.report();
    if (!r) return;
    const rows = [["Véhicule","Opérations","Volume (L)","Coût (FCFA)"]];
    r.byVehicle.forEach((v: any) => rows.push([`${v.vehicle?.plate} – ${v.vehicle?.brand}`, v.count, v.qty.toFixed(1), v.cost.toFixed(0)]));
    const csv = rows.map(r => r.join(";")).join("\n");
    const a = document.createElement("a");
    a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    a.download = `rapport-carburant-${this.start}-${this.end}.csv`;
    a.click();
  }
}
