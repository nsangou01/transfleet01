import { Routes } from '@angular/router';
import { authGuard, guestGuard, managerGuard, driverRedirectGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', canActivate: [guestGuard], loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent) },
  { path: 'force-password-change', canActivate: [authGuard], loadComponent: () => import('./pages/force-password-change/force-password-change.component').then(m => m.ForcePasswordChangeComponent) },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./shared/components/shell/shell.component').then(m => m.ShellComponent),
    children: [
      { path: 'dashboard',     canActivate: [driverRedirectGuard], loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'vehicles',      canActivate: [managerGuard], loadComponent: () => import('./pages/vehicles/vehicles.component').then(m => m.VehiclesComponent) },
      { path: 'drivers',       canActivate: [managerGuard], loadComponent: () => import('./pages/drivers/drivers.component').then(m => m.DriversComponent) },
      { path: 'trips',         loadComponent: () => import('./pages/trips/trips.component').then(m => m.TripsComponent) },
      { path: 'fuel',          canActivate: [managerGuard], loadComponent: () => import('./pages/fuel/fuel.component').then(m => m.FuelComponent) },
      { path: 'maintenance',   canActivate: [managerGuard], loadComponent: () => import('./pages/maintenance/maintenance.component').then(m => m.MaintenanceComponent) },
      { path: 'tracking',      canActivate: [managerGuard], loadComponent: () => import('./pages/tracking/tracking.component').then(m => m.TrackingComponent) },
      { path: 'notifications', loadComponent: () => import('./pages/notifications/notifications.component').then(m => m.NotificationsComponent) },
      // La route des rapports est désactivée ci-dessous :
      // { path: 'reports',        canActivate: [managerGuard], loadComponent: () => import('./pages/reports/reports.component').then(m => m.ReportsComponent) },
    ],
  },
  { path: '**', loadComponent: () => import('./pages/not-found/not-found.component').then(m => m.NotFoundComponent) },
];