import { create } from 'zustand';
import { NotificationAlert, Vendor } from '../types';

interface NotificationsState {
  alerts: NotificationAlert[];
  notifications: { vendor: Vendor; alert: NotificationAlert }[];
  unreadCount: number;
  isLoading: boolean;
  setAlerts: (alerts: NotificationAlert[]) => void;
  addAlert: (alert: NotificationAlert) => void;
  removeAlert: (id: string) => void;
  updateAlert: (id: string, updates: Partial<NotificationAlert>) => void;
  addNotification: (vendor: Vendor, alert: NotificationAlert) => void;
  markAsRead: (index: number) => void;
  clearNotifications: () => void;
  setLoading: (isLoading: boolean) => void;
}

export const useNotificationsStore = create<NotificationsState>()((set) => ({
  alerts: [],
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  setAlerts: (alerts) => set({ alerts }),

  addAlert: (alert) =>
    set((state) => ({
      alerts: [...state.alerts, alert],
    })),

  removeAlert: (id) =>
    set((state) => ({
      alerts: state.alerts.filter((a) => a.id !== id),
    })),

  updateAlert: (id, updates) =>
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.id === id ? { ...a, ...updates } : a
      ),
    })),

  addNotification: (vendor, alert) =>
    set((state) => ({
      notifications: [{ vendor, alert }, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    })),

  markAsRead: (index) =>
    set((state) => {
      const newNotifications = [...state.notifications];
      if (newNotifications[index]) {
        newNotifications[index] = {
          ...newNotifications[index],
          read: true,
        } as any;
      }
      return {
        notifications: newNotifications,
        unreadCount: Math.max(0, state.unreadCount - 1),
      };
    }),

  clearNotifications: () => set({ notifications: [], unreadCount: 0 }),

  setLoading: (isLoading) => set({ isLoading }),
}));
