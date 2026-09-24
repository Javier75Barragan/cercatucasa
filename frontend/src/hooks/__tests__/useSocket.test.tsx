import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useSocket } from '../useSocket';
import { useAuthStore } from '../../stores/authStore';
import { useVendorsStore } from '../../stores/vendorsStore';
import { io } from 'socket.io-client';

// Mock dependencias
vi.mock('socket.io-client', () => ({
  io: vi.fn(),
}));

vi.mock('../../stores/authStore', () => ({
  useAuthStore: vi.fn(),
}));

vi.mock('../../stores/vendorsStore', () => ({
  useVendorsStore: vi.fn(),
}));

describe('useSocket Hook', () => {
  const mockSocket = {
    on: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(),
    once: vi.fn(),
    connected: true,
  };

  const mockAddVendors = vi.fn();
  const mockUpdateVendor = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    (io as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockSocket);

    (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      token: 'fake-jwt-token',
      location: { lat: 4.6097, lng: -74.0817 },
    });
    
    // Configurar getState para useAuthStore.getState()
    (useAuthStore as any).getState = vi.fn().mockReturnValue({
      location: { lat: 4.6097, lng: -74.0817 }
    });

    (useVendorsStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      addVendors: mockAddVendors,
      updateVendor: mockUpdateVendor,
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('connects to websocket when token is provided', () => {
    renderHook(() => useSocket());

    expect(io).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
      auth: { token: 'fake-jwt-token' },
      transports: ['websocket'],
    }));
  });

  it('does not connect if no token is provided', () => {
    (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      token: null,
      location: null,
    });

    renderHook(() => useSocket());

    expect(io).not.toHaveBeenCalled();
  });

  it('registers event listeners on connection', () => {
    renderHook(() => useSocket());

    expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('nearby-vendors', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('vendor-location-updated', expect.any(Function));
  });

  it('emits join-location when joinLocation is called', () => {
    const { result } = renderHook(() => useSocket());

    result.current.joinLocation(4.6097, -74.0817, 500);

    expect(mockSocket.emit).toHaveBeenCalledWith('join-location', {
      lat: 4.6097,
      lng: -74.0817,
      radius: 500,
    });
  });

  it('emits join-vendor-room when joinVendorRoom is called', () => {
    const { result } = renderHook(() => useSocket());

    result.current.joinVendorRoom('vendor-123');

    expect(mockSocket.emit).toHaveBeenCalledWith('join-vendor-room', { vendorId: 'vendor-123' });
  });

  it('disconnects socket on unmount', () => {
    const { unmount } = renderHook(() => useSocket());

    unmount();

    expect(mockSocket.disconnect).toHaveBeenCalledTimes(1);
  });
});
