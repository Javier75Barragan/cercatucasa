import { create } from 'zustand';
import { Vendor, Category } from '../types';

interface VendorsState {
  vendors: Vendor[];
  selectedVendor: Vendor | null;
  trackingVendor: Vendor | null;
  categories: Category[];
  filters: {
    category?: string;
    type?: string;
    radius: number;
  };
  isLoading: boolean;
  setVendors: (vendors: Vendor[]) => void;
  addVendors: (vendors: Vendor[]) => void;
  updateVendor: (id: string, updates: Partial<Vendor>) => void;
  setSelectedVendor: (vendor: Vendor | null) => void;
  setTrackingVendor: (vendor: Vendor | null) => void;
  setCategories: (categories: Category[]) => void;
  setFilters: (filters: Partial<VendorsState['filters']>) => void;
  setLoading: (isLoading: boolean) => void;
  clearVendors: () => void;
}

export const useVendorsStore = create<VendorsState>()((set) => ({
  vendors: [],
  selectedVendor: null,
  trackingVendor: null,
  categories: [],
  filters: {
    radius: 200,
  },
  isLoading: false,

  setVendors: (vendors) => set({ vendors }),

  addVendors: (newVendors) =>
    set((state) => {
      const existingIds = new Set(state.vendors.map((v) => v.id));
      const uniqueNewVendors = newVendors.filter((v) => !existingIds.has(v.id));
      return { vendors: [...state.vendors, ...uniqueNewVendors] };
    }),

  updateVendor: (id, updates) =>
    set((state) => ({
      vendors: state.vendors.map((v) =>
        v.id === id ? { ...v, ...updates } : v
      ),
      selectedVendor:
        state.selectedVendor?.id === id
          ? { ...state.selectedVendor, ...updates }
          : state.selectedVendor,
      trackingVendor:
        state.trackingVendor?.id === id
          ? { ...state.trackingVendor, ...updates }
          : state.trackingVendor,
    })),

  setSelectedVendor: (vendor) => set({ selectedVendor: vendor }),

  setTrackingVendor: (vendor) => set({ trackingVendor: vendor }),

  setCategories: (categories) => set({ categories }),

  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
    })),

  setLoading: (isLoading) => set({ isLoading }),

  clearVendors: () => set({ vendors: [], selectedVendor: null, trackingVendor: null }),
}));
