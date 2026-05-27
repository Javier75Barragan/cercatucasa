import axios, { AxiosError, AxiosInstance } from 'axios';
import { ApiResponse, Vendor, Product, NotificationAlert } from '../types';
import { useAuthStore } from '../stores/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 10000,
});

// Request interceptor — Lee el token directamente del estado de memoria de Zustand
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Variables para manejar la renovación del token
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor para manejar errores
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiResponse<any>>) => {
    const originalRequest = error.config;

    // Si es un 401 y no es una petición de reintento o de login/refresh
    if (error.response?.status === 401 && originalRequest && !(originalRequest as any)._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      (originalRequest as any)._retry = true;
      isRefreshing = true;

      try {
        // Intentar refrescar el token (el navegador envía la cookie httpOnly automáticamente)
        const res = await authApi.refresh();
        const { token } = res.data.data;

        useAuthStore.getState().setToken(token);
        processQueue(null, token);
        
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        if (typeof window !== 'undefined') {
          const logout = useAuthStore.getState().logout;
          logout();
          window.location.replace('/login'); // Usamos replace para no ensuciar el historial
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),

  register: (data: { email: string; password: string; name: string; phone: string; role?: string }) =>
    api.post('/auth/register', data),

  refresh: () =>
    api.post('/auth/refresh'),

  logout: () =>
    api.post('/auth/logout'),

  getMe: () =>
    api.get('/auth/me'),

  updateProfile: (data: Partial<{ name: string; phone: string; avatar_url: string }>) =>
    api.put('/auth/me', data),

  changePassword: (currentPassword: string, newPassword: string) =>
    api.put('/auth/password', { currentPassword, newPassword }),
};

// Vendors API
export const vendorsApi = {
  getNearby: (params: { lat: number; lng: number; radius?: number; category?: string; type?: string }) =>
    api.get('/vendors/nearby', { params }),

  getMe: () =>
    api.get('/vendors/me'),

  getById: (id: string) =>
    api.get(`/vendors/${id}`),

  create: (data: Partial<Vendor>) =>
    api.post('/vendors', data),

  update: (id: string, data: Partial<Vendor>) =>
    api.put(`/vendors/${id}`, data),

  updateLocation: (id: string, data: { latitude: number; longitude: number; accuracy?: number }) =>
    api.post(`/vendors/${id}/location`, data),

  toggleVisibility: (id: string, isActive: boolean) =>
    api.patch(`/vendors/${id}/location/toggle`, { is_active: isActive }),

  getCategories: () =>
    api.get('/vendors/categories'),

  rate: (id: string, rating: number, comment?: string) =>
    api.post(`/vendors/${id}/reviews`, { rating, comment }),
};

// Products API
export const productsApi = {
  getByVendor: (vendorId: string, availableOnly = true) =>
    api.get(`/products/vendor/${vendorId}`, { params: { available_only: availableOnly } }),

  create: (data: Partial<Product>) =>
    api.post('/products', data),

  update: (id: string, data: Partial<Product>) =>
    api.put(`/products/${id}`, data),

  delete: (id: string) =>
    api.delete(`/products/${id}`),
};

// Notifications API
export const notificationsApi = {
  getAlerts: () =>
    api.get('/notifications/alerts'),

  createAlert: (data: Partial<NotificationAlert>) =>
    api.post('/notifications/alerts', data),

  updateAlert: (id: string, data: Partial<NotificationAlert>) =>
    api.put(`/notifications/alerts/${id}`, data),

  deleteAlert: (id: string) =>
    api.delete(`/notifications/alerts/${id}`),

  checkNearby: (data: { latitude: number; longitude: number }) =>
    api.post('/notifications/check', data),
};

// Incidents API
export const incidentsApi = {
  getTypes: () =>
    api.get('/incidents/types'),

  create: (data: { name: string; phone: string; latitude: number; longitude: number; type: string; description?: string }) =>
    api.post('/incidents', data),

  getNearby: (params: { lat: number; lng: number; radius?: number; type?: string; status?: string }) =>
    api.get('/incidents/nearby', { params }),

  updateStatus: (id: string, status: 'pending' | 'in_progress' | 'resolved' | 'cancelled', notes?: string) =>
    api.patch(`/incidents/${id}/status`, { status, notes }),

  getMyReports: () =>
    api.get('/incidents/my-reports'),
};

// Common API
export const commonApi = {
  uploadImage: (formData: FormData) =>
    api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
};

export default api;
