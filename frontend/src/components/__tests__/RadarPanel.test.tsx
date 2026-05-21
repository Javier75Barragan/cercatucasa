import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import RadarPanel from '../RadarPanel';
import { useVendorsStore } from '../../stores/vendorsStore';

// Mock de Zustand store
vi.mock('../../stores/vendorsStore', () => ({
  useVendorsStore: vi.fn(),
}));

describe('RadarPanel Component', () => {
  const mockSetSelectedVendor = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useVendorsStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      setSelectedVendor: mockSetSelectedVendor,
    });
  });

  it('renders empty state when there are no encounters', () => {
    render(<RadarPanel encounters={[]} onClose={vi.fn()} />);
    
    expect(screen.getByText('Buscando rastros...')).toBeInTheDocument();
    expect(screen.getByText(/Vendedores que hayan pasado cerca/i)).toBeInTheDocument();
  });

  it('renders encounters correctly', () => {
    const mockEncounters = [
      {
        vendor: {
          id: 'v1',
          user_id: 'u1',
          name: 'Helados Don Pepe',
          type: 'ambulant',
          category: 'other',
          subcategories: [],
          phone: '',
          photos: [],
          is_active: true,
          is_verified: true,
          created_at: new Date(),
          updated_at: new Date(),
          rating: 5,
          review_count: 1,
        } as any, // Type cast to avoid full Vendor object mock
        lastSeen: new Date(Date.now() - 5000), // 5 seconds ago
      },
    ];

    render(<RadarPanel encounters={mockEncounters} onClose={vi.fn()} />);

    // Comprobar que no hay estado vacío
    expect(screen.queryByText('Buscando rastros...')).not.toBeInTheDocument();
    
    // Comprobar que se renderiza el nombre del vendedor
    expect(screen.getByText('Helados Don Pepe')).toBeInTheDocument();
    
    // Comprobar que se renderiza el tiempo ("Hace un momento" for 5 seconds ago)
    expect(screen.getByText(/Hace un momento/i)).toBeInTheDocument();
  });

  it('shows community activity summary metrics', () => {
    const mockEncounters = [
      {
        vendor: {
          id: 'v1',
          name: 'Helados Don Pepe',
          category: 'other',
        } as any,
        lastSeen: new Date(),
      },
      {
        vendor: {
          id: 'v2',
          name: 'Frutas La 27',
          category: 'fruits_vegetables',
        } as any,
        lastSeen: new Date(Date.now() - 1000 * 60 * 15),
      },
    ];

    render(<RadarPanel encounters={mockEncounters} onClose={vi.fn()} />);

    expect(screen.getByText(/Actividad hoy/i)).toBeInTheDocument();
    expect(screen.getByText(/Por revisar/i)).toBeInTheDocument();
  });

  it('calls setSelectedVendor when an encounter is clicked', () => {
    const mockVendor = {
      id: 'v1',
      name: 'Helados Don Pepe',
      category: 'other',
    };

    const mockEncounters = [
      {
        vendor: mockVendor as any,
        lastSeen: new Date(),
      },
    ];

    render(<RadarPanel encounters={mockEncounters} onClose={vi.fn()} />);

    const vendorElement = screen.getByText('Helados Don Pepe');
    fireEvent.click(vendorElement);

    expect(mockSetSelectedVendor).toHaveBeenCalledTimes(1);
    expect(mockSetSelectedVendor).toHaveBeenCalledWith(mockVendor);
  });
});
