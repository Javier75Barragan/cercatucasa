import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import { query } from '../config/database';

let io: Server;

export const initializeWebSocket = (httpServer: HttpServer): Server => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Cliente conectado: ${socket.id}`);

    // Unirse a una sala de ubicación (para recibir actualizaciones de vendedores cercanos)
    socket.on('join-location', async (data: { lat: number; lng: number; radius?: number }) => {
      const { lat, lng, radius = 200 } = data;
      const roomId = `location:${lat.toFixed(3)}:${lng.toFixed(3)}`;

      socket.join(roomId);
      console.log(`📍 Cliente ${socket.id} unido a ${roomId}`);

      // Enviar vendedores activos cercanos
      try {
        const radiusDegrees = radius / 111000;
        const result = await query(
          `SELECT
            v.id, v.name, v.category, v.type, v.avatar_url, v.rating,
            vl.latitude, vl.longitude,
            (6371000 * acos(
              cos(radians($1)) * cos(radians(vl.latitude)) *
              cos(radians(vl.longitude) - radians($2)) +
              sin(radians($1)) * sin(radians(vl.latitude))
            )) as distance_meters
          FROM vendors v
          JOIN vendor_locations vl ON v.id = vl.vendor_id
          WHERE vl.is_active = true
            AND v.is_active = true
            AND vl.latitude BETWEEN $1 - $4 AND $1 + $4
            AND vl.longitude BETWEEN $2 - $4 AND $2 + $4
          HAVING (6371000 * acos(
            cos(radians($1)) * cos(radians(vl.latitude)) *
            cos(radians(vl.longitude) - radians($2)) +
            sin(radians($1)) * sin(radians(vl.latitude))
          )) <= $3
          ORDER BY distance_meters ASC`,
          [lat, lng, radius, radiusDegrees]
        );

        socket.emit('nearby-vendors', result.rows);
      } catch (error) {
        console.error('Error obteniendo vendedores cercanos:', error);
      }
    });

    // Vendedor actualiza su ubicación
    socket.on('update-location', async (data: {
      vendorId: string;
      lat: number;
      lng: number;
      accuracy?: number;
    }) => {
      const { vendorId, lat, lng, accuracy = 10 } = data;

      try {
        // Desactivar ubicaciones anteriores
        await query(
          `UPDATE vendor_locations SET is_active = false WHERE vendor_id = $1`,
          [vendorId]
        );

        // Insertar nueva ubicación
        await query(
          `INSERT INTO vendor_locations (vendor_id, latitude, longitude, accuracy, is_active)
           VALUES ($1, $2, $3, $4, true)
           ON CONFLICT (vendor_id) DO UPDATE SET
             latitude = EXCLUDED.latitude,
             longitude = EXCLUDED.longitude,
             accuracy = EXCLUDED.accuracy,
             is_active = true,
             updated_at = CURRENT_TIMESTAMP`,
          [vendorId, lat, lng, accuracy]
        );

        // Notificar a clientes cercanos
        const nearbyRooms = getNearbyRooms(lat, lng);
        nearbyRooms.forEach(room => {
          io.to(room).emit('vendor-location-updated', {
            vendorId,
            lat,
            lng,
            accuracy,
            timestamp: new Date().toISOString(),
          });
        });

        socket.emit('location-updated', { success: true });
      } catch (error) {
        console.error('Error actualizando ubicación:', error);
        socket.emit('location-error', { error: 'Error actualizando ubicación' });
      }
    });

    // Vendedor activa/desactiva su visibilidad
    socket.on('toggle-visibility', async (data: { vendorId: string; isActive: boolean }) => {
      const { vendorId, isActive } = data;

      try {
        await query(
          `UPDATE vendor_locations SET is_active = $1 WHERE vendor_id = $2`,
          [isActive, vendorId]
        );

        // Obtener ubicación actual para notificar
        const locationResult = await query(
          `SELECT latitude, longitude FROM vendor_locations WHERE vendor_id = $1`,
          [vendorId]
        );

        if (locationResult.rows.length > 0) {
          const { latitude, longitude } = locationResult.rows[0];
          const nearbyRooms = getNearbyRooms(latitude, longitude);

          nearbyRooms.forEach(room => {
            io.to(room).emit('vendor-visibility-changed', {
              vendorId,
              isActive,
              timestamp: new Date().toISOString(),
            });
          });
        }

        socket.emit('visibility-toggled', { success: true, isActive });
      } catch (error) {
        console.error('Error cambiando visibilidad:', error);
        socket.emit('visibility-error', { error: 'Error cambiando visibilidad' });
      }
    });

    // Dejar la sala de ubicación
    socket.on('leave-location', (data: { lat: number; lng: number }) => {
      const { lat, lng } = data;
      const roomId = `location:${lat.toFixed(3)}:${lng.toFixed(3)}`;
      socket.leave(roomId);
      console.log(`📍 Cliente ${socket.id} salió de ${roomId}`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Cliente desconectado: ${socket.id}`);
    });
  });

  return io;
};

// Helper para obtener salas cercanas (dividimos el mapa en celdas de ~111m)
const getNearbyRooms = (lat: number, lng: number): string[] => {
  const rooms: string[] = [];
  const latGrid = Math.floor(lat * 1000) / 1000;
  const lngGrid = Math.floor(lng * 1000) / 1000;

  // Agregar celdas adyacentes
  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      rooms.push(`location:${(latGrid + i * 0.001).toFixed(3)}:${(lngGrid + j * 0.001).toFixed(3)}`);
    }
  }

  return rooms;
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error('WebSocket no inicializado');
  }
  return io;
};

export default { initializeWebSocket, getIO };
