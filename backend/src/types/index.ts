// Tipos de usuario
export type UserRole = 'customer' | 'seller' | 'admin';

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  phone: string;
  role: UserRole;
  avatar_url?: string;
  created_at: Date;
  updated_at: Date;
  is_active: boolean;
}

// Tipos de vendedor/tienda
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
  created_at: Date;
  updated_at: Date;
  rating: number;
  review_count: number;
  schedule?: VendorSchedule;
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

// Ubicación geográfica
export interface GeoLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: Date;
}

export interface VendorLocation {
  id: string;
  vendor_id: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  is_active: boolean;
  updated_at: Date;
}

// Productos
export interface Product {
  id: string;
  vendor_id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  photos: string[];
  category: string;
  is_available: boolean;
  created_at: Date;
  updated_at: Date;
}

// Alertas de notificación
export interface NotificationAlert {
  id: string;
  user_id: string;
  category: string;
  subcategories?: string[];
  vendor_types: VendorType[];
  radius_meters: number;
  schedule_start?: string;
  schedule_end?: string;
  days_of_week: number[];
  is_active: boolean;
  created_at: Date;
}

// Reseñas
export interface Review {
  id: string;
  vendor_id: string;
  user_id: string;
  rating: number;
  comment?: string;
  photos?: string[];
  created_at: Date;
}

// Solicitudes de contacto
export interface ContactRequest {
  id: string;
  vendor_id: string;
  customer_id: string;
  product_id?: string;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  created_at: Date;
  updated_at: Date;
}

// Respuestas de API
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// JWT Payload
export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}
