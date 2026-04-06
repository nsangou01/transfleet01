import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ApiService } from '../../../core/services/api.service';

interface NavItem { label: string; route: string; managerOnly?: boolean }

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent implements OnInit {
  auth = inject(AuthService);
  api  = inject(ApiService);

  sidebarOpen  = signal(true);
  userMenuOpen = signal(false);
  unreadCount  = signal(0);

  user      = this.auth.currentUser;
  isManager = this.auth.isManager;

  initials = computed(() => {
    const u = this.user();
    return u ? (u.firstName[0] + u.lastName[0]).toUpperCase() : '??';
  });

  navItems: NavItem[] = [
    { label: 'Tableau de bord', route: '/dashboard' },
    { label: 'Véhicules',       route: '/vehicles',      managerOnly: true },
    { label: 'Conducteurs',     route: '/drivers',       managerOnly: true },
    { label: 'Trajets',         route: '/trips' },
    { label: 'Carburant',       route: '/fuel',          managerOnly: true },
    { label: 'Maintenance',     route: '/maintenance',   managerOnly: true },
    { label: 'Suivi GPS',       route: '/tracking',      managerOnly: true },
    { label: 'Notifications',   route: '/notifications' },
    // La ligne des rapports a été mise en commentaire juste en dessous :
    // { label: 'Rapports',        route: '/reports',       managerOnly: true },
  ];

  visibleItems = computed(() =>
    this.navItems.filter(i => !i.managerOnly || this.isManager())
  );

  ngOnInit(): void {
    this.refreshUnread();
    setInterval(() => this.refreshUnread(), 60_000);
  }

  private refreshUnread(): void {
    this.api.getNotifications({ limit: 1 }).subscribe({
      next: (r: any) => this.unreadCount.set(r.unread ?? 0),
      error: () => {},
    });
  }

  toggleSidebar(): void  { this.sidebarOpen.update(v => !v); }
  toggleUserMenu(): void { this.userMenuOpen.update(v => !v); }
  closeUserMenu(): void  { this.userMenuOpen.set(false); }
  logout(): void         { this.auth.logout(); }
}