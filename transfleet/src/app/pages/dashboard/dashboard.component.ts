import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

interface VehicleRow {
  id: number; plate: string; brand: string; model: string; driver: string;
  status: 'active' | 'idle' | 'maintenance' | 'offline';
  speed: number; fuel: number; location: string; lastUpdate: string;
}

interface TripRow {
  id: string; vehicle: string; driver: string; origin: string; destination: string;
  distance: number; duration: string; status: 'ongoing' | 'completed' | 'pending'; date: string;
}

interface AlertRow {
  id: number; type: 'maintenance' | 'fuel' | 'speeding' | 'geofence';
  vehicle: string; message: string; time: string; priority: 'high' | 'medium' | 'low';
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {

  private authService = inject(AuthService);
  alerts: any[] = [];

  // ── Auth state from real AuthService signals ──────────────────────────
  currentUser = this.authService.currentUser;
  userRole    = this.authService.userRole;

  displayName = computed(() => {
    const u = this.currentUser() as any;
    if (!u) return 'Utilisateur';
    return `${u.prenom} ${u.nom.charAt(0)}.`;
  });

  userInitials = computed(() => {
    const u = this.currentUser() as any;
    if (!u) return '?';
    return `${u.prenom.charAt(0)}${u.nom.charAt(0)}`.toUpperCase();
  });

  roleLabel = computed(() => {
    const map: Record<string, string> = {
      admin: 'Administrateur', manager: 'Gestionnaire de flotte', driver: 'Conducteur'
    };
    return map[this.userRole() ?? ''] ?? '';
  });

  // ── UI state ─────────────────────────────────────────────────────────
  sidebarCollapsed = signal(false);
  activeNav        = signal('dashboard');
  currentTime      = signal(this.formatTime());
  private timerHandle?: ReturnType<typeof setInterval>;

  // ── KPIs ─────────────────────────────────────────────────────────────
  kpis = [
    { label: 'Véhicules actifs',    value: '24', total: '32',       icon: '🚛', color: 'blue',   trend: '+2',  trendUp: true  },
    { label: 'Trajets en cours',    value: '8',  total: '',         icon: '🗺️', color: 'green',  trend: '+3',  trendUp: true  },
    { label: 'Alertes maintenance', value: '3',  total: '',         icon: '🔧', color: 'orange', trend: '+1',  trendUp: false },
    { label: 'Conso. carburant',    value: '1 248 L', total: 'ce mois', icon: '⛽', color: 'purple', trend: '-8%', trendUp: true },
  ];

  // ── Vehicles ──────────────────────────────────────────────────────────
  vehicles: VehicleRow[] = [
    { id: 1, plate: 'BA-123-CM', brand: 'Mercedes', model: 'Actros',   driver: 'Koffi Mensah',       status: 'active',      speed: 87, fuel: 72, location: 'Autoroute Yaoundé-Douala', lastUpdate: 'il y a 1 min' },
    { id: 2, plate: 'LT-456-CM', brand: 'MAN',      model: 'TGX',      driver: 'Jean-Pierre Abanda', status: 'idle',        speed: 0,  fuel: 55, location: 'Port de Douala',           lastUpdate: 'il y a 3 min' },
    { id: 3, plate: 'DL-789-CM', brand: 'Volvo',    model: 'FH16',     driver: 'Non assigné',        status: 'maintenance', speed: 0,  fuel: 40, location: 'Garage central',           lastUpdate: 'il y a 2h'    },
    { id: 4, plate: 'YD-321-CM', brand: 'DAF',      model: 'XF',       driver: 'Aminata Diallo',     status: 'active',      speed: 62, fuel: 88, location: 'Bafoussam, N4',           lastUpdate: 'il y a 2 min' },
    { id: 5, plate: 'NK-654-CM', brand: 'Scania',   model: 'R450',     driver: 'Pierre Kouassi',     status: 'active',      speed: 74, fuel: 31, location: 'Ngaoundéré',              lastUpdate: 'il y a 1 min' },
    { id: 6, plate: 'GR-987-CM', brand: 'Renault',  model: 'Trucks T', driver: 'Samuel Biya',        status: 'offline',     speed: 0,  fuel: 0,  location: 'Inconnu',                 lastUpdate: 'il y a 4h'    },
  ];

  // ── Trips ─────────────────────────────────────────────────────────────
  trips: TripRow[] = [
    { id: 'TRP-2026-041', vehicle: 'BA-123-CM', driver: 'Koffi Mensah',       origin: 'Douala',      destination: 'Yaoundé',       distance: 245, duration: '3h 20min', status: 'ongoing',   date: 'Auj. 09:15' },
    { id: 'TRP-2026-040', vehicle: 'YD-321-CM', driver: 'Aminata Diallo',     origin: 'Douala',      destination: 'Bafoussam',     distance: 312, duration: '5h 10min', status: 'ongoing',   date: 'Auj. 07:30' },
    { id: 'TRP-2026-039', vehicle: 'NK-654-CM', driver: 'Pierre Kouassi',     origin: 'Yaoundé',     destination: 'Ngaoundéré',    distance: 598, duration: '8h 45min', status: 'ongoing',   date: 'Auj. 05:00' },
    { id: 'TRP-2026-038', vehicle: 'LT-456-CM', driver: 'Jean-Pierre Abanda', origin: 'Douala Port', destination: 'Entrepôt Ctr.', distance: 12,  duration: '25min',    status: 'completed', date: 'Hier 16:40' },
    { id: 'TRP-2026-037', vehicle: 'DL-789-CM', driver: 'Koffi Mensah',       origin: 'Yaoundé',     destination: 'Douala',        distance: 245, duration: '3h 40min', status: 'completed', date: 'Hier 11:00' },
  ];

  // ── Alerts ────────────────────────────────────────────────────────────
  private allAlerts: AlertRow[] = [
    { id: 1, type: 'maintenance', vehicle: 'DL-789-CM', message: 'Vidange moteur à effectuer (250 000 km atteints)',  time: '09:42', priority: 'high'   },
    { id: 2, type: 'fuel',        vehicle: 'NK-654-CM', message: 'Niveau carburant critique — 31% restant',           time: '09:35', priority: 'high'   },
    { id: 3, type: 'speeding',    vehicle: 'BA-123-CM', message: 'Vitesse limite dépassée — 87 km/h (max 80)',        time: '09:28', priority: 'medium' },
    { id: 4, type: 'maintenance', vehicle: 'LT-456-CM', message: 'Révision des freins prévue dans 3 jours',          time: '08:00', priority: 'low'    },
  ];

  dismissedIds  = signal<number[]>([]);
  visibleAlerts = computed(() =>
    this.allAlerts.filter(a => !this.dismissedIds().includes(a.id))
  );

  // ── Fuel chart ────────────────────────────────────────────────────────
  fuelData   = [65, 82, 71, 90, 78, 55, 93, 68, 75, 88, 72, 60];
  fuelMonths = ['Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc', 'Jan', 'Fév', 'Mar'];
  fuelBarMax = Math.max(...[65, 82, 71, 90, 78, 55, 93, 68, 75, 88, 72, 60]);

  // ── Sidebar nav ───────────────────────────────────────────────────────
  navItems = [
    { id: 'dashboard',     label: 'Tableau de bord', icon: '⊞',  badge: 0,  badgeAlert: false },
    { id: 'vehicles',      label: 'Véhicules',        icon: '🚛', badge: 32, badgeAlert: false },
    { id: 'drivers',       label: 'Conducteurs',      icon: '👤', badge: 18, badgeAlert: false },
    { id: 'trips',         label: 'Trajets',           icon: '🗺️', badge: 0,  badgeAlert: false },
    { id: 'tracking',      label: 'Suivi GPS',         icon: '📍', badge: 0,  badgeAlert: false },
    { id: 'fuel',          label: 'Carburant',         icon: '⛽', badge: 0,  badgeAlert: false },
    { id: 'maintenance',   label: 'Maintenance',       icon: '🔧', badge: 3,  badgeAlert: true  },
    { id: 'reports',       label: 'Rapports',          icon: '📊', badge: 0,  badgeAlert: false },
    { id: 'notifications', label: 'Notifications',     icon: '🔔', badge: 4,  badgeAlert: true  },
  ];

  // ── Lifecycle ─────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.timerHandle = setInterval(() => {
      this.currentTime.set(this.formatTime());
      this.vehicles = this.vehicles.map(v => ({
        ...v,
        speed: v.status === 'active'
          ? Math.max(0, Math.min(120, v.speed + Math.floor(Math.random() * 11 - 5)))
          : v.speed,
      }));
    }, 5000);
  }

  ngOnDestroy(): void {
    if (this.timerHandle) clearInterval(this.timerHandle);
  }

  // ── Actions ───────────────────────────────────────────────────────────
  toggleSidebar(): void { this.sidebarCollapsed.update(v => !v); }
  setNav(id: string): void { this.activeNav.set(id); }
  dismissAlert(id: number): void { this.dismissedIds.update(ids => [...ids, id]); }

  onLogout(): void {
    this.authService.logout();   // Delegates to real AuthService → clears token + navigates to /login
  }

  // ── Helpers ───────────────────────────────────────────────────────────
  getStatusLabel(s: string): string {
    return ({ active: 'En transit', idle: 'Stationnaire', maintenance: 'Maintenance', offline: 'Hors ligne' } as Record<string, string>)[s] ?? s;
  }

  getAlertIcon(t: string): string {
    return ({ maintenance: '🔧', fuel: '⛽', speeding: '⚡', geofence: '📍' } as Record<string, string>)[t] ?? '⚠️';
  }

  private formatTime(): string {
    return new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }
}