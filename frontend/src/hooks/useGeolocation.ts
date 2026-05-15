import { useState, useEffect, useCallback, useRef } from 'react';
import { Coordinates } from '../types';

interface GeolocationState {
  location: Coordinates | null;
  error: string | null;
  isLoading: boolean;
}

export const useGeolocation = (options?: PositionOptions) => {
  const [state, setState] = useState<GeolocationState>({
    location: null,
    error: null,
    isLoading: true,
  });

  const watchId = useRef<number | null>(null);

  const handleSuccess = useCallback((position: GeolocationPosition) => {
    setState({
      location: {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
      },
      error: null,
      isLoading: false,
    });
  }, []);

  const handleError = useCallback((error: GeolocationPositionError) => {
    setState((prev) => ({
      ...prev,
      error: error.message,
      isLoading: false,
    }));
  }, []);

  const startWatching = useCallback(() => {
    if (!navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        error: 'Geolocalización no soportada',
        isLoading: false,
      }));
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true }));

    // Obtener posición inicial
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
      ...options,
    });

    // Watch position
    watchId.current = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 10000,
        ...options,
      }
    );
  }, [handleSuccess, handleError, options]);

  const stopWatching = useCallback(() => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
  }, []);

  const simulateLocation = useCallback((lat = 7.065, lng = -73.84) => {
    // Coordenadas de Barrancabermeja por defecto
    setState({
      location: { lat, lng, accuracy: 10 },
      error: null,
      isLoading: false,
    });
  }, []);

  const refreshLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        error: 'Geolocalización no soportada',
        isLoading: false,
      }));
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true }));

    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
      ...options,
    });
    
    // Auto-fallback en desarrollo si tarda mucho
    if (import.meta.env.DEV) {
      setTimeout(() => {
        setState(prev => {
          if (prev.isLoading) {
            return {
              location: { lat: 7.065, lng: -73.84, accuracy: 10 },
              error: null,
              isLoading: false,
            };
          }
          return prev;
        });
      }, 5000);
    }
  }, [handleSuccess, handleError, options]);

  useEffect(() => {
    startWatching();
    
    // Auto-fallback timeout for initial load in DEV
    let fallbackTimer: ReturnType<typeof setTimeout>;
    if (import.meta.env.DEV) {
      fallbackTimer = setTimeout(() => {
        setState(prev => {
          if (prev.isLoading || prev.error) {
            console.log("Aplicando ubicación simulada (Modo DEV)...");
            return {
              location: { lat: 7.065, lng: -73.84, accuracy: 10 },
              error: null,
              isLoading: false,
            };
          }
          return prev;
        });
      }, 5000);
    }

    return () => {
      stopWatching();
      if (fallbackTimer) clearTimeout(fallbackTimer);
    };
  }, [startWatching, stopWatching]);

  return {
    ...state,
    refreshLocation,
    simulateLocation,
    startWatching,
    stopWatching,
  };
};

export default useGeolocation;
