import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../stores/authStore';
import { useVendorsStore } from '../stores/vendorsStore';
import { Vendor, Incident } from '../types';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';

export const useSocket = (onIncidentAlert?: (incident: Incident) => void) => {
  const socketRef = useRef<Socket | null>(null);
  const { location, token } = useAuthStore();
  const { addVendors, updateVendor } = useVendorsStore();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!token) return;

    socketRef.current = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('🟢 WebSocket conectado');
      setIsConnected(true);
      // Si ya tenemos ubicación, unirse a la sala inmediatamente
      const currentLocation = useAuthStore.getState().location;
      if (currentLocation) {
        socket.emit('join-location', {
          lat: currentLocation.lat,
          lng: currentLocation.lng,
          radius: 200,
        });
      }
    });

    socket.on('disconnect', () => {
      console.log('🔴 WebSocket desconectado');
      setIsConnected(false);
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

    // Alertas de incidentes para vendedores
    socket.on('incident-alert', (data: { incident: Incident }) => {
      console.log('🚨 Alerta de incidente recibida:', data.incident);
      onIncidentAlert?.(data.incident);
    });

    socket.on('incident-status-updated', (data: { incidentId: string; status: string }) => {
      console.log('📋 Estado de incidente actualizado:', data);
    });

    return () => {
      socket.disconnect();
    };
  }, [addVendors, updateVendor, token, onIncidentAlert]);

  // Separate effect to join location when it changes, without reconnecting socket
  useEffect(() => {
    if (socketRef.current?.connected && location) {
      socketRef.current.emit('join-location', {
        lat: location.lat,
        lng: location.lng,
        radius: 200,
      });
    }
  }, [location]);

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

  // Unirse a sala personal del vendedor para recibir alertas de incidentes
  const joinVendorRoom = useCallback((vendorId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('join-vendor-room', { vendorId });
      console.log(`🏪 Unido a sala vendor:${vendorId}`);
    } else {
      // Reintentar cuando se conecte
      socketRef.current?.once('connect', () => {
        socketRef.current?.emit('join-vendor-room', { vendorId });
        console.log(`🏪 Unido a sala vendor:${vendorId} (retry)`);
      });
    }
  }, []);

  // Unirse a sala global de autoridades para recibir TODAS las alertas de incidentes
  const joinAuthorityRoom = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('join-authority-room');
      console.log('🛡️ Unido a sala de autoridades');
    } else {
      socketRef.current?.once('connect', () => {
        socketRef.current?.emit('join-authority-room');
        console.log('🛡️ Unido a sala de autoridades (retry)');
      });
    }
  }, []);

  return {
    socket: socketRef.current,
    joinLocation,
    leaveLocation,
    updateLocation,
    toggleVisibility,
    joinVendorRoom,
    joinAuthorityRoom,
    isConnected,
  };
};

export default useSocket;
