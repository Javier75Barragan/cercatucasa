import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../stores/authStore';
import { useVendorsStore } from '../stores/vendorsStore';
import { Vendor } from '../types';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);
  const { location } = useAuthStore();
  const { addVendors, updateVendor } = useVendorsStore();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    socketRef.current = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('🟢 WebSocket conectado');

      // Unirse a la sala de ubicación si hay ubicación
      if (location) {
        socket.emit('join-location', {
          lat: location.lat,
          lng: location.lng,
          radius: 200,
        });
      }
    });

    socket.on('disconnect', () => {
      console.log('🔴 WebSocket desconectado');
    });

    socket.on('nearby-vendors', (vendors: Vendor[]) => {
      addVendors(vendors);
    });

    socket.on('vendor-location-updated', (data: {
      vendorId: string;
      lat: number;
      lng: number;
      accuracy: number;
    }) => {
      updateVendor(data.vendorId, {
        latitude: data.lat,
        longitude: data.lng,
        accuracy: data.accuracy,
      });
    });

    socket.on('vendor-visibility-changed', (data: {
      vendorId: string;
      isActive: boolean;
    }) => {
      updateVendor(data.vendorId, {
        location_active: data.isActive,
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [location, addVendors, updateVendor]);

  const joinLocation = useCallback((lat: number, lng: number, radius = 200) => {
    socketRef.current?.emit('join-location', { lat, lng, radius });
  }, []);

  const leaveLocation = useCallback((lat: number, lng: number) => {
    socketRef.current?.emit('leave-location', { lat, lng });
  }, []);

  const updateLocation = useCallback((vendorId: string, lat: number, lng: number, accuracy = 10) => {
    socketRef.current?.emit('update-location', {
      vendorId,
      lat,
      lng,
      accuracy,
    });
  }, []);

  const toggleVisibility = useCallback((vendorId: string, isActive: boolean) => {
    socketRef.current?.emit('toggle-visibility', { vendorId, isActive });
  }, []);

  return {
    socket: socketRef.current,
    joinLocation,
    leaveLocation,
    updateLocation,
    toggleVisibility,
    isConnected: socketRef.current?.connected ?? false,
  };
};

export default useSocket;
