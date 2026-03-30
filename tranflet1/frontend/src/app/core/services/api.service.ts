import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Vehicle, Driver, Trip, FuelRecord, Maintenance,
  Notification, TrackingPoint, PagedResponse, DashboardStats
} from '../models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  private params(obj: Record<string, any> = {}): HttpParams {
    let p = new HttpParams();
    Object.entries(obj).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') p = p.set(k, String(v));
    });
    return p;
  }

  // ── Dashboard ───────────────────────────────────────────────────────────────
  getDashboard(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.base}/reports/dashboard`);
  }

  // ── Vehicles ────────────────────────────────────────────────────────────────
  getVehicles(q: Record<string, any> = {}): Observable<PagedResponse<Vehicle>> {
    return this.http.get<PagedResponse<Vehicle>>(`${this.base}/vehicles`, { params: this.params(q) });
  }
  getVehicle(id: number): Observable<Vehicle> {
    return this.http.get<Vehicle>(`${this.base}/vehicles/${id}`);
  }
  getVehicleStats(): Observable<any> {
    return this.http.get(`${this.base}/vehicles/stats`);
  }
  createVehicle(data: Partial<Vehicle>): Observable<Vehicle> {
    return this.http.post<Vehicle>(`${this.base}/vehicles`, data);
  }
  updateVehicle(id: number, data: Partial<Vehicle>): Observable<Vehicle> {
    return this.http.put<Vehicle>(`${this.base}/vehicles/${id}`, data);
  }
  deleteVehicle(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/vehicles/${id}`);
  }

  // ── Drivers ─────────────────────────────────────────────────────────────────
  getDrivers(q: Record<string, any> = {}): Observable<PagedResponse<Driver>> {
    return this.http.get<PagedResponse<Driver>>(`${this.base}/drivers`, { params: this.params(q) });
  }
  getDriver(id: number): Observable<Driver> {
    return this.http.get<Driver>(`${this.base}/drivers/${id}`);
  }
  getDriverStats(): Observable<any> {
    return this.http.get(`${this.base}/drivers/stats`);
  }
  createDriver(data: Record<string, any>): Observable<Driver> {
    return this.http.post<Driver>(`${this.base}/drivers`, data);
  }
  updateDriver(id: number, data: Partial<Driver>): Observable<Driver> {
    return this.http.put<Driver>(`${this.base}/drivers/${id}`, data);
  }
  deleteDriver(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/drivers/${id}`);
  }

  // ── Trips ───────────────────────────────────────────────────────────────────
  getTrips(q: Record<string, any> = {}): Observable<PagedResponse<Trip>> {
    return this.http.get<PagedResponse<Trip>>(`${this.base}/trips`, { params: this.params(q) });
  }
  getTrip(id: number): Observable<Trip> {
    return this.http.get<Trip>(`${this.base}/trips/${id}`);
  }
  getTripStats(): Observable<any> {
    return this.http.get(`${this.base}/trips/stats`);
  }
  createTrip(data: Partial<Trip>): Observable<Trip> {
    return this.http.post<Trip>(`${this.base}/trips`, data);
  }
  updateTrip(id: number, data: Partial<Trip>): Observable<Trip> {
    return this.http.put<Trip>(`${this.base}/trips/${id}`, data);
  }
  startTrip(id: number): Observable<Trip> {
    return this.http.post<Trip>(`${this.base}/trips/${id}/start`, {});
  }
  completeTrip(id: number, data: Record<string, any>): Observable<Trip> {
    return this.http.post<Trip>(`${this.base}/trips/${id}/complete`, data);
  }
  cancelTrip(id: number, reason?: string): Observable<Trip> {
    return this.http.post<Trip>(`${this.base}/trips/${id}/cancel`, { reason });
  }

  // ── Fuel ────────────────────────────────────────────────────────────────────
  getFuel(q: Record<string, any> = {}): Observable<PagedResponse<FuelRecord>> {
    return this.http.get<PagedResponse<FuelRecord>>(`${this.base}/fuel`, { params: this.params(q) });
  }
  getFuelStats(q: Record<string, any> = {}): Observable<any> {
    return this.http.get(`${this.base}/fuel/stats`, { params: this.params(q) });
  }
  createFuel(data: Partial<FuelRecord>): Observable<FuelRecord> {
    return this.http.post<FuelRecord>(`${this.base}/fuel`, data);
  }
  updateFuel(id: number, data: Partial<FuelRecord>): Observable<FuelRecord> {
    return this.http.put<FuelRecord>(`${this.base}/fuel/${id}`, data);
  }
  deleteFuel(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/fuel/${id}`);
  }

  // ── Maintenance ─────────────────────────────────────────────────────────────
  getMaintenance(q: Record<string, any> = {}): Observable<PagedResponse<Maintenance>> {
    return this.http.get<PagedResponse<Maintenance>>(`${this.base}/maintenance`, { params: this.params(q) });
  }
  createMaintenance(data: Partial<Maintenance>): Observable<Maintenance> {
    return this.http.post<Maintenance>(`${this.base}/maintenance`, data);
  }
  updateMaintenance(id: number, data: Partial<Maintenance>): Observable<Maintenance> {
    return this.http.put<Maintenance>(`${this.base}/maintenance/${id}`, data);
  }
  deleteMaintenance(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/maintenance/${id}`);
  }

  // ── Notifications ───────────────────────────────────────────────────────────
  getNotifications(q: Record<string, any> = {}): Observable<PagedResponse<Notification> & { unread: number }> {
    return this.http.get<any>(`${this.base}/notifications`, { params: this.params(q) });
  }
  createNotification(data: Partial<Notification>): Observable<Notification> {
    return this.http.post<Notification>(`${this.base}/notifications`, data);
  }
  markRead(id: number): Observable<any> {
    return this.http.patch(`${this.base}/notifications/${id}/read`, {});
  }
  markAllRead(): Observable<any> {
    return this.http.patch(`${this.base}/notifications/read-all`, {});
  }
  deleteNotification(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/notifications/${id}`);
  }

  // ── Tracking ────────────────────────────────────────────────────────────────
  getTracking(): Observable<{ vehicle: Vehicle; lastPosition: TrackingPoint | null }[]> {
    return this.http.get<any>(`${this.base}/tracking`);
  }
  pushTracking(data: Partial<TrackingPoint>): Observable<TrackingPoint> {
    return this.http.post<TrackingPoint>(`${this.base}/tracking`, data);
  }
  getTrackingHistory(vehicleId: number, start: string, end: string): Observable<TrackingPoint[]> {
    return this.http.get<TrackingPoint[]>(`${this.base}/tracking/${vehicleId}/history`, {
      params: this.params({ start, end }),
    });
  }

  // ── Reports ─────────────────────────────────────────────────────────────────
  getFuelReport(q: Record<string, any> = {}): Observable<any> {
    return this.http.get(`${this.base}/reports/fuel`, { params: this.params(q) });
  }

  // ── Users ───────────────────────────────────────────────────────────────────
  getUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/users`);
  }
  createManager(data: Record<string, any>): Observable<any> {
    return this.http.post<any>(`${this.base}/users/managers`, data);
  }
  createDriverUser(data: Record<string, any>): Observable<any> {
    return this.http.post<any>(`${this.base}/users/drivers`, data);
  }
  toggleUserActive(id: number): Observable<any> {
    return this.http.patch<any>(`${this.base}/users/${id}/toggle`, {});
  }
  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/users/${id}`);
  }
  resetUserPassword(id: number, new_password: string): Observable<any> {
    return this.http.post<any>(`${this.base}/users/${id}/reset-password`, { new_password });
  }
}
