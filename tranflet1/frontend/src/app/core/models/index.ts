// ── Auth ──────────────────────────────────────────────────────────────────────
export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: 'admin' | 'manager' | 'driver';
  phone?: string;
  driverId?: number | null;
  passwordIsDefault?: boolean;
}

export interface LoginResponse {
  token: string;
  expiresIn: number;
  user: User;
}

// ── Vehicle ───────────────────────────────────────────────────────────────────
export type VehicleStatus = 'available' | 'in_use' | 'maintenance' | 'out_of_service';
export type FuelType = 'diesel' | 'gasoline' | 'hybrid' | 'electric';

export interface Vehicle {
  id: number;
  plate: string;
  brand: string;
  model: string;
  year: number;
  color?: string;
  vin?: string;
  fuel_type: FuelType;
  capacity: number;
  mileage: number;
  status: VehicleStatus;
  purchase_date?: string;
  purchase_price?: number;
  insurance_expiry?: string;
  inspection_expiry?: string;
  driver_id?: number;
  notes?: string;
  assignedDriver?: Driver;
  created_at?: string;
}

// ── Driver ────────────────────────────────────────────────────────────────────
export type DriverStatus = 'available' | 'on_trip' | 'off_duty' | 'suspended';

export interface Driver {
  id: number;
  user_id: number;
  license_number: string;
  license_category: string;
  license_expiry: string;
  experience_years: number;
  avg_rating: number;
  total_trips: number;
  status: DriverStatus;
  vehicle_id?: number;
  emergency_contact?: string;
  emergency_phone?: string;
  user?: { id: number; first_name: string; last_name: string; email: string; phone?: string };
  assignedVehicle?: Vehicle;
}

// ── Trip ──────────────────────────────────────────────────────────────────────
export type TripStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled';

export interface Trip {
  id: number;
  vehicle_id: number;
  driver_id: number;
  from_location: string;
  to_location: string;
  estimated_distance?: number;
  actual_distance?: number;
  estimated_duration?: string;
  actual_duration?: string;
  status: TripStatus;
  purpose?: string;
  passengers?: number;
  fuel_used?: number;
  notes?: string;
  scheduled_start?: string;
  actual_start?: string;
  actual_end?: string;
  vehicle?: Vehicle;
  driver?: Driver;
  created_at?: string;
}

// ── Fuel ──────────────────────────────────────────────────────────────────────
export interface FuelRecord {
  id: number;
  vehicle_id: number;
  driver_id: number;
  date: string;
  quantity: number;
  price_per_litre: number;
  total_cost: number;
  fuel_type: FuelType;
  station_name?: string;
  station_city?: string;
  mileage_at_fill?: number;
  notes?: string;
  vehicle?: Vehicle;
  driver?: Driver;
}

// ── Maintenance ───────────────────────────────────────────────────────────────
export type MaintenanceStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type MaintenanceType = 'routine' | 'repair' | 'inspection' | 'emergency';

export interface Maintenance {
  id: number;
  vehicle_id: number;
  type: MaintenanceType;
  description: string;
  scheduled_date: string;
  completed_date?: string;
  status: MaintenanceStatus;
  estimated_cost?: number;
  actual_cost?: number;
  provider?: string;
  provider_phone?: string;
  labor_cost?: number;
  parts_cost?: number;
  notes?: string;
  vehicle?: Vehicle;
}

// ── Notification ──────────────────────────────────────────────────────────────
export type NotifType = 'alert' | 'info' | 'success' | 'warning';

export interface Notification {
  id: number;
  sender_id?: number;
  recipient_id?: number;
  type: NotifType;
  title: string;
  message: string;
  is_read: boolean;
  read_at?: string;
  target_role?: 'all' | 'manager' | 'driver';
  created_at?: string;
}

// ── Tracking ──────────────────────────────────────────────────────────────────
export interface TrackingPoint {
  id?: number;
  vehicle_id: number;
  trip_id?: number;
  latitude: number;
  longitude: number;
  speed?: number;
  engine_status?: 'on' | 'off' | 'unknown';
  mileage?: number;
  recorded_at?: string;
  vehicle?: Vehicle;
}

// ── API Generic Response ──────────────────────────────────────────────────────
export interface PagedResponse<T> {
  total: number;
  page: number;
  data: T[];
  unread?: number;
}

export interface DashboardStats {
  vehicles: { total: number; available: number; in_use: number; maintenance: number; out_of_service: number };
  drivers:  { total: number; available: number; on_trip: number; off_duty: number; suspended: number };
  trips:    { total: number; planned: number; in_progress: number; completed: number; cancelled: number };
  fuel:     { todayCost: number; monthCost: number };
  maintenance: { pending: number; records: Maintenance[] };
}
