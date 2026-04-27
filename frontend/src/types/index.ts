export type UserRole = 'customer' | 'seller' | 'admin' | 'authority';

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: UserRole;
  avatar_url?: string;
  created_at: string;
  is_active: boolean;
}

export type VendorType = 'ambulant' | 'store' | 'pharmacy' | 'service';

export interface Vendor {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  type: VendorType;
  category: string;
  subcategories: string[];
  phone: string;
  whatsapp?: string;
  email?: string;
  website?: string;
  avatar_url?: string;
  photos: string[];
  address?: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  rating: number;
  review_count: number;
  schedule?: VendorSchedule;
  // Campos de ubicación
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  distance_meters?: number;
  location_active?: boolean;
  location_updated?: string;
}

export interface VendorSchedule {
  monday: DaySchedule | null;
  tuesday: DaySchedule | null;
  wednesday: DaySchedule | null;
  thursday: DaySchedule | null;
  friday: DaySchedule | null;
  saturday: DaySchedule | null;
  sunday: DaySchedule | null;
}

export interface DaySchedule {
  open: string;
  close: string;
}

export interface Product {
  id: string;
  vendor_id: string;
  name: string;
  description?: string;
  price?: number;
  currency: string;
  photos: string[];
  category: string;
  is_available: boolean;
  created_at: string;
}

export interface NotificationAlert {
  id: string;
  user_id: string;
  category: string;
  subcategories: string[];
  vendor_types: VendorType[];
  radius_meters: number;
  schedule_start?: string;
  schedule_end?: string;
  days_of_week: number[];
  is_active: boolean;
  created_at: string;
}

export interface Coordinates {
  lat: number;
  lng: number;
  accuracy?: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  phone: string;
  role?: UserRole;
}

export interface Incident {
  id: string;
  user_id?: string;
  name: string;
  phone: string;
  latitude: number;
  longitude: number;
  type: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'cancelled';
  description?: string;
  created_at: string;
  updated_at?: string;
  resolved_at?: string;
  resolved_by?: string;
  notes?: string;
  distance_meters?: number;
}

export interface IncidentType {
  id: string;
  name: string;
  icon: string;
  color: string;
}
