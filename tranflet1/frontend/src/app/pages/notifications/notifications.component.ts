import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

interface AppNotification {
  id: number;
  sender_id?: number;
  recipient_id?: number;
  type: 'alert' | 'info' | 'success' | 'warning';
  title: string;
  message: string;
  is_read: boolean;
  read_at?: string;
  target_role?: string;
  created_at?: string;
}

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss'],
})
export class NotificationsComponent implements OnInit {
  // Correction de l'injection : on utilise inject() pour obtenir l'instance
  private api = inject(ApiService);
  private authService = inject(AuthService);

  // Signaux et Data
  notifs = signal<AppNotification[]>([]);
  total = signal(0);
  unread = signal(0);
  loading = signal(false);
  showModal = signal(false);
  sending = signal(false);
  
  filterRead = '';
  form: Record<string, any> = { type: 'info', target_role: 'all', title: '', message: '' };
  
  // Accès au getter ou à la propriété du service
  get isManager() {
    return this.authService.isManager;
  }

  ngOnInit() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    const q: Record<string, any> = { limit: 100 };
    if (this.filterRead !== '') q['is_read'] = this.filterRead;

    this.api.getNotifications(q).subscribe({
      next: (r: any) => {
        this.notifs.set(r.data);
        this.total.set(r.total);
        this.unread.set(r.unread ?? 0);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  markOne(n: AppNotification): void {
    this.api.markRead(n.id).subscribe(() => this.load());
  }

  markAll(): void {
    this.api.markAllRead().subscribe(() => this.load());
  }

  del(n: AppNotification): void {
    if (confirm('Supprimer cette notification ?')) {
      this.api.deleteNotification(n.id).subscribe(() => this.load());
    }
  }

  send(): void {
    if (!this.form['title'] || !this.form['message']) return;
    this.sending.set(true);
    this.api.createNotification(this.form).subscribe({
      next: () => {
        this.showModal.set(false);
        this.form = { type: 'info', target_role: 'all', title: '', message: '' };
        this.load();
        this.sending.set(false);
      },
      error: () => this.sending.set(false),
    });
  }
}