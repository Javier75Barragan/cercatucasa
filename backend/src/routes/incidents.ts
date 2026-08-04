import { Router } from 'express';
import { query } from '../config/database';
import { authenticate, authorize } from '../middleware/auth';
import { optionalAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { validate } from '../middleware/validate';
import { createIncidentSchema, updateIncidentStatusSchema } from '../schemas/incidents';
import { ApiResponse } from '../types';
import { getIO } from '../services/websocket';

const router = Router();

// Tipos de incidentes disponibles
const INCIDENT_TYPES = [
  { id: 'accident', name: 'Accidente de Tránsito', icon: '🚗', color: '#ef4444' },
  { id: 'medical', name: 'Emergencia Médica', icon: '🚑', color: '#f43f5e' },
  { id: 'fire', name: 'Incendio', icon: '🔥', color: '#f97316' },
  { id: 'police', name: 'Incidente de Seguridad', icon: '👮', color: '#6366f1' },
  { id: 'road_block', name: 'Bloqueo de Vía', icon: '🚧', color: '#f59e0b' },
  { id: 'fallen_tree', name: 'Árbol Caído', icon: '🌳', color: '#84cc16' },
  { id: 'flood', name: 'Inundación', icon: '🌊', color: '#3b82f6' },
  { id: 'other', name: 'Otro', icon: '⚠️', color: '#6b7280' },
];

// ============================================
// PARA TODOS (autenticados o no): Obtener tipos
// ============================================
/**
 * @openapi
 * /api/incidents/types:
 *   get:
 *     tags:
 *       - Incidentes
 *     summary: Obtener tipos de incidentes
 *     description: Devuelve la lista de tipos de incidentes disponibles con sus iconos y colores. Ruta pública.
 *     responses:
 *       200:
 *         description: Lista de tipos de incidentes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "accident"
 *                       name:
 *                         type: string
 *                         example: "Accidente de Tránsito"
 *                       icon:
 *                         type: string
 *                         example: "🚗"
 *                       color:
 *                         type: string
 *                         example: "#ef4444"
 */
router.get(
  '/types',
  asyncHandler(async (_req, res) => {
    const response: ApiResponse<typeof INCIDENT_TYPES> = {
      success: true,
      data: INCIDENT_TYPES,
    };
    res.json(response);
  })
);

// ============================================
// PARA TODOS (autenticados o no): Crear reporte
// ============================================
/**
 * @openapi
 * /api/incidents:
 *   post:
 *     tags:
 *       - Incidentes
 *     summary: Crear reporte de incidente
 *     description: Reporta un incidente en una ubicación. Puede ser usado por usuarios autenticados o anónimos. Notifica a vendedores y autoridades cercanas por WebSocket.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - phone
 *               - latitude
 *               - longitude
 *               - type
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 255
 *                 example: "Juan Pérez"
 *               phone:
 *                 type: string
 *                 minLength: 5
 *                 maxLength: 20
 *                 example: "+573001234567"
 *               latitude:
 *                 type: number
 *                 minimum: -90
 *                 maximum: 90
 *                 example: 4.7110
 *               longitude:
 *                 type: number
 *                 minimum: -180
 *                 maximum: 180
 *                 example: -74.0721
 *               type:
 *                 type: string
 *                 enum: [accident, medical, fire, police, road_block, fallen_tree, flood, other]
 *                 example: "accident"
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *                 example: "Choque entre dos vehículos en la esquina"
 *     responses:
 *       201:
 *         description: Incidente reportado exitosamente
 *       400:
 *         description: Datos de entrada inválidos o tipo de incidente no válido
 */
router.post(
  '/',
  optionalAuth, // Permite usuarios no autenticados también
  validate(createIncidentSchema),
  asyncHandler(async (req, res) => {
    const { name, phone, latitude, longitude, type, description } = req.body;

    if (!INCIDENT_TYPES.find(t => t.id === type)) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Tipo de incidente no válido',
      };
      res.status(400).json(response);
      return;
    }

    // Crear incidente (user_id puede ser null si no está autenticado)
    const userId = req.user?.userId || null;
    const result = await query(
      `INSERT INTO incidents (user_id, name, phone, latitude, longitude, type, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [userId, name, phone, latitude, longitude, type, description || null]
    );

    const incident = result.rows[0];

    // Notificar en tiempo real a los vendedores cercanos en un radio de 5km
    const radiusDegrees = 5000 / 111000;
    const vendorsResult = await query(
      `SELECT v.id, vl.latitude, vl.longitude,
              (6371000 * acos(
                LEAST(1.0, cos(radians($1)) * cos(radians(vl.latitude)) *
                cos(radians(vl.longitude) - radians($2)) +
                sin(radians($1)) * sin(radians(vl.latitude)))
              )) as distance_meters
       FROM vendors v
       JOIN vendor_locations vl ON v.id = vl.vendor_id
       WHERE vl.is_active = true
         AND v.is_active = true
         AND vl.latitude BETWEEN $1 - $3 AND $1 + $3
         AND vl.longitude BETWEEN $2 - $3 AND $2 + $3`,
      [latitude, longitude, radiusDegrees]
    );

    // Filtrar por distancia real y emitir evento WebSocket a cada vendedor
    try {
      const io = getIO();
      vendorsResult.rows
        .filter((vendor: any) => vendor.distance_meters <= 5000)
        .forEach((vendor: any) => {
          const vendorRoom = `vendor:${vendor.id}`;
          io.to(vendorRoom).emit('incident-alert', {
            incident: {
              id: incident.id,
              name: incident.name,
              phone: incident.phone,
              latitude: parseFloat(incident.latitude),
              longitude: parseFloat(incident.longitude),
              type: incident.type,
              description: incident.description,
              created_at: incident.created_at,
              status: incident.status,
              distance_meters: Math.round(vendor.distance_meters),
            },
          });
        });

      // Notificar a TODAS las autoridades conectadas
      io.to('authorities').emit('incident-alert', {
        incident: {
          id: incident.id,
          name: incident.name,
          phone: incident.phone,
          latitude: parseFloat(incident.latitude),
          longitude: parseFloat(incident.longitude),
          type: incident.type,
          description: incident.description,
          created_at: incident.created_at,
          status: incident.status,
          is_authority_alert: true // Marca para que el dashboard de autoridad lo resalte
        },
      });
    } catch (wsError) {
      // WebSocket no disponible, continuar igual
      console.warn('⚠️ WebSocket no disponible para notificar incidente:', wsError);
    }

    const response: ApiResponse<typeof incident> = {
      success: true,
      data: incident,
      message: 'Incidente reportado exitosamente. Los vendedores y autoridades cercanas han sido notificados.',
    };

    res.status(201).json(response);
  })
);

// ============================================
// PARA VENDEDORES/AUTORIDADES: Obtener incidentes cercanos
// ============================================
/**
 * @openapi
 * /api/incidents/nearby:
 *   get:
 *     tags:
 *       - Incidentes
 *     summary: Obtener incidentes cercanos
 *     description: Devuelve los incidentes cercanos a una ubicación dada, filtrados por radio, tipo y estado. Requiere autenticación.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *         schema:
 *           type: number
 *         description: Latitud del punto de referencia
 *       - in: query
 *         name: lng
 *         required: true
 *         schema:
 *           type: number
 *         description: Longitud del punto de referencia
 *       - in: query
 *         name: radius
 *         schema:
 *           type: integer
 *           default: 5000
 *         description: Radio de búsqueda en metros
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [accident, medical, fire, police, road_block, fallen_tree, flood, other]
 *         description: Filtrar por tipo de incidente
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, in_progress, resolved, cancelled]
 *         description: "Filtrar por estado. Por defecto: pending e in_progress"
 *     responses:
 *       200:
 *         description: Lista de incidentes cercanos
 *       400:
 *         description: Latitud y longitud son requeridas
 *       401:
 *         description: No autorizado
 */
router.get(
  '/nearby',
  authenticate,
  authorize('seller', 'admin', 'customer'),
  asyncHandler(async (req, res) => {
    const { lat, lng, radius = 5000, type, status } = req.query;

    if (!lat || !lng) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Latitud y longitud son requeridas',
      };
      res.status(400).json(response);
      return;
    }

    const latitude = parseFloat(lat as string);
    const longitude = parseFloat(lng as string);
    const radiusMeters = parseInt(radius as string);
    const radiusDegrees = radiusMeters / 111000;

    let sql = `
      SELECT *,
        (6371000 * acos(
          LEAST(1.0, cos(radians($1)) * cos(radians(latitude)) *
          cos(radians(longitude) - radians($2)) +
          sin(radians($1)) * sin(radians(latitude)))
        )) as distance_meters
      FROM incidents
      WHERE latitude BETWEEN $1 - $4 AND $1 + $4
        AND longitude BETWEEN $2 - $4 AND $2 + $4
    `;

    const params: any[] = [latitude, longitude, radiusMeters, radiusDegrees];
    let paramIndex = 5;

    if (type) {
      sql += ` AND type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    if (status) {
      sql += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    } else {
      sql += ` AND status IN ('pending', 'in_progress')`;
    }

    sql += ` ORDER BY created_at DESC`;

    const result = await query(sql, params);

    // Filtrar por distancia real (la cláusula HAVING no aplica sin GROUP BY)
    const filteredRows = result.rows.filter(
      (row: any) => row.distance_meters <= radiusMeters
    );

    const response: ApiResponse<typeof filteredRows> = {
      success: true,
      data: filteredRows,
    };

    res.json(response);
  })
);

// ============================================
// Actualizar estado del incidente (aceptar/resolver)
// ============================================
/**
 * @openapi
 * /api/incidents/{id}/status:
 *   patch:
 *     tags:
 *       - Incidentes
 *     summary: Actualizar estado de un incidente
 *     description: Cambia el estado de un incidente (aceptar, resolver, cancelar). Notifica por WebSocket.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del incidente
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, in_progress, resolved, cancelled]
 *                 example: "in_progress"
 *               notes:
 *                 type: string
 *                 maxLength: 1000
 *                 example: "En camino al lugar del incidente"
 *     responses:
 *       200:
 *         description: Estado del incidente actualizado
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Incidente no encontrado
 */
router.patch(
  '/:id/status',
  authenticate,
  authorize('seller', 'admin', 'customer'),
  validate(updateIncidentStatusSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, notes } = req.body;

    let updateSql = `UPDATE incidents SET status = $1, updated_at = CURRENT_TIMESTAMP`;
    const params: any[] = [status];
    let paramIndex = 2;

    if (notes) {
      updateSql += `, notes = COALESCE(notes || E'\\n' || $${paramIndex}, $${paramIndex})`;
      params.push(notes);
      paramIndex++;
    }

    if (status === 'resolved') {
      updateSql += `, resolved_at = CURRENT_TIMESTAMP, resolved_by = $${paramIndex}`;
      params.push(req.user!.userId);
      paramIndex++;
    }

    updateSql += ` WHERE id = $${paramIndex} RETURNING *`;
    params.push(id);

    const result = await query(updateSql, params);

    if (result.rows.length === 0) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Incidente no encontrado',
      };
      res.status(404).json(response);
      return;
    }

    const incident = result.rows[0];

    // Notificar actualización por WebSocket
    try {
      const io = getIO();
      io.emit('incident-status-updated', {
        incidentId: incident.id,
        status: incident.status,
        resolvedBy: incident.resolved_by,
      });
    } catch (wsError) {
      console.warn('⚠️ WebSocket no disponible para notificar status:', wsError);
    }

    const response: ApiResponse<typeof incident> = {
      success: true,
      data: incident,
      message: status === 'in_progress' ? 'Incidente aceptado' : `Incidente marcado como ${status}`,
    };

    res.json(response);
  })
);

// ============================================
// Obtener historial de incidentes del usuario
// ============================================
/**
 * @openapi
 * /api/incidents/my-reports:
 *   get:
 *     tags:
 *       - Incidentes
 *     summary: Obtener historial de incidentes del usuario
 *     description: Devuelve todos los incidentes reportados por el usuario autenticado.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de incidentes del usuario
 *       401:
 *         description: No autorizado
 */
router.get(
  '/my-reports',
  authenticate,
  asyncHandler(async (req, res) => {
    const result = await query(
      `SELECT * FROM incidents WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.user!.userId]
    );

    const response: ApiResponse<typeof result.rows> = {
      success: true,
      data: result.rows,
    };

    res.json(response);
  })
);

export default router;
