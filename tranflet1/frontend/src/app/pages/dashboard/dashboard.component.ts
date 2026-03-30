import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { DashboardStats } from '../../core/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private api = inject(ApiService);
  stats   = signal<DashboardStats | null>(null);
  loading = signal(false);
  error   = signal('');

  ngOnInit() { this.load(); }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.api.getDashboard().subscribe({
      next: (d) => { this.stats.set(d); this.loading.set(false); },
      error: (e) => { this.error.set(e?.error?.message || 'Erreur de chargement'); this.loading.set(false); },
    });
  }

  statusLabel(s: string): string {
    const map: Record<string, string> = { scheduled:'Planifiée', in_progress:'En cours', completed:'Terminée', cancelled:'Annulée' };
    return map[s] ?? s;
  }
}
