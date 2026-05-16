import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Home from '../Home';
import { useGeolocation } from '../../hooks/useGeolocation';
import { useVendorsStore } from '../../stores/vendorsStore';
import { useAuthStore } from '../../stores/authStore';
import { vendorsApi } from '../../services/api';

// Mocks de hooks y stores
vi.mock('../../hooks/useGeolocation', () => ({
  useGeolocation: vi.fn(),
}));

vi.mock('../../stores/vendorsStore', () => ({
  useVendorsStore: vi.fn(),
}));

vi.mock('../../stores/authStore', () => ({
  useAuthStore: vi.fn(),
}));

vi.mock('../../services/api', () => ({
  vendorsApi: {
    getNearby: vi.fn(),
  },
}));

// Mock de componentes hijos complejos para evitar errores de Leaflet/DOM
vi.mock('../../components/Map', () => ({
  default: () => <div data-testid="mock-map">Map Component</div>,
}));

vi.mock('../../components/MapFilters', () => ({
  default: () => <div data-testid="mock-filters">Map Filters Component</div>,
}));

vi.mock('../../components/VendorCard', () => ({
  default: ({ vendor }: any) => <div data-testid="vendor-card">{vendor.name}</div>,
}));

vi.mock('../../components/VendorDetails', () => ({
  default: () => <div data-testid="vendor-details">Vendor Details</div>,
}));

vi.mock('../../components/RadarPanel', () => ({
  default: () => <div data-testid="radar-panel">Radar Panel</div>,
}));

vi.mock('../../components/IncidentReportForm', () => ({
  default: () => <div data-testid="incident-form">Incident Form</div>,
}));

describe('Home Page', () => {
  const mockLocation = { lat: 4.6097, lng: -74.0817 };
  const mockSetLocation = vi.fn();
  const mockSetVendors = vi.fn();
  const mockSetFilters = vi.fn();
  const mockSetLoading = vi.fn();

  const mockVendor = {
    id: 'v1',
    name: 'Vendedor de Prueba',
    category: 'other',
    radius: 200,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup useGeolocation mock
    (useGeolocation as any).mockReturnValue({
      location: mockLocation,
      error: null,
      isLoading: false,
      refreshLocation: vi.fn(),
    });

    // Setup useAuthStore mock
    (useAuthStore as any).mockReturnValue({
      setLocation: mockSetLocation,
    });

    // Setup useVendorsStore mock
    (useVendorsStore as any).mockReturnValue({
      vendors: [],
      setVendors: mockSetVendors,
      filters: { radius: 200 },
      setFilters: mockSetFilters,
      setLoading: mockSetLoading,
      selectedVendor: null,
      isLoading: false,
    });

    // Setup vendorsApi mock
    (vendorsApi.getNearby as any).mockResolvedValue({
      data: {
        success: true,
        data: [mockVendor],
      },
    });
  });

  it('renders the Home page with map and sidebar', async () => {
    render(<Home />);
    
    expect(screen.getByTestId('mock-map')).toBeInTheDocument();
    expect(screen.getByText(/Cerca de ti/i)).toBeInTheDocument();
  });

  it('shows empty state when no vendors are found', async () => {
    // Override store mock to show no vendors
    (useVendorsStore as any).mockReturnValue({
      vendors: [],
      setVendors: mockSetVendors,
      filters: { radius: 200 },
      setFilters: mockSetFilters,
      setLoading: mockSetLoading,
      selectedVendor: null,
      isLoading: false,
    });

    render(<Home />);

    expect(screen.getByText('Silencio en el área')).toBeInTheDocument();
    expect(screen.getByText(/Expandir búsqueda/i)).toBeInTheDocument();
  });

  it('calls setFilters when the expand radius button is clicked', async () => {
    (useVendorsStore as any).mockReturnValue({
      vendors: [],
      setVendors: mockSetVendors,
      filters: { radius: 200 },
      setFilters: mockSetFilters,
      setLoading: mockSetLoading,
      selectedVendor: null,
      isLoading: false,
    });

    render(<Home />);

    const expandButton = screen.getByText(/Expandir búsqueda/i);
    fireEvent.click(expandButton);

    expect(mockSetFilters).toHaveBeenCalledWith({ radius: 700 });
  });

  it('renders vendor cards when vendors are available', async () => {
    (useVendorsStore as any).mockReturnValue({
      vendors: [mockVendor],
      setVendors: mockSetVendors,
      filters: { radius: 200 },
      setFilters: mockSetFilters,
      setLoading: mockSetLoading,
      selectedVendor: null,
      isLoading: false,
    });

    render(<Home />);

    expect(screen.getByTestId('vendor-card')).toBeInTheDocument();
    expect(screen.getByText('Vendedor de Prueba')).toBeInTheDocument();
  });

  it('shows error state when geolocation fails', () => {
    (useGeolocation as any).mockReturnValue({
      location: null,
      error: 'Permission denied',
      isLoading: false,
      refreshLocation: vi.fn(),
    });

    render(<Home />);

    expect(screen.getByText('Ubicación Requerida')).toBeInTheDocument();
  });
});
