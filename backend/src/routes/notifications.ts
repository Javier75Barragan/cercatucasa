import { Router } from 'express';
import { query } from '../config/database';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { ApiResponse, NotificationAlert } from '../types';

const router = Router();

// Crear alerta de notificación
router.post(
  '/alerts',
  authenticate,
  asyncHandler(async (req, res) => {
    const {
      category,
      subcategories = [],
      vendor_types = ['ambulant', 'store', 'pharmacy', 'service'],
      radius_meters = 200,
      schedule_start,
      schedule_end,
      days_of_week = [0, 1, 2, 3, 4, 5, 6],
    } = req.body;

    if (!category) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'La categoría es requerida',
      };
      res.status(400).json(response);
      return;
    }

    const result = await query<NotificationAlert>(
      `INSERT INTO notification_alerts (
        user_id, category, subcategories, vendor_types,
        radius_meters, schedule_start, schedule_end, days_of_week
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        req.user!.userId,
        category,
        subcategories,
        vendor_types,
        radius_meters,
        schedule_start,
        schedule_end,
        days_of_week,
      ]
    );

    const response: ApiResponse<NotificationAlert> = {
      success: true,
      data: result.rows[0],
      message: 'Alerta creada exitosamente',
    };

    res.status(201).json(response);
  })
);

// Listar alertas del usuario
router.get(
  '/alerts',
  authenticate,
  asyncHandler(async (req, res) => {
    const result = await query<NotificationAlert>(
      `SELECT * FROM notification_alerts WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.user!.userId]
    );

    const response: ApiResponse<NotificationAlert[]> = {
      success: true,
      data: result.rows,
    };

    res.json(response);
  })
);

// Actualizar alerta
router.put(
  '/alerts/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    // Verificar propiedad
    const alertResult = await query(
      `SELECT user_id FROM notification_alerts WHERE id = $1`,
      [id]
    );

    if (alertResult.rows.length === 0) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Alerta no encontrada',
      };
      res.status(404).json(response);
      return;
    }

    if (alertResult.rows[0].user_id !== req.user!.userId) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'No tienes permisos para editar esta alerta',
      };
      res.status(403).json(response);
      return;
    }

    const allowedFields = [
      'category', 'subcategories', 'vendor_types', 'radius_meters',
      'schedule_start', 'schedule_end', 'days_of_week', 'is_active'
    ];

    const setClauses: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        setClauses.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (setClauses.length === 0) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'No hay campos válidos para actualizar',
      };
      res.status(400).json(response);
      return;
    }

    values.push(id);

    const result = await query<NotificationAlert>(
      `UPDATE notification_alerts SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    const response: ApiResponse<NotificationAlert> = {
      success: true,
      data: result.rows[0],
      message: 'Alerta actualizada exitosamente',
    };

    res.json(response);
  })
);

// Eliminar alerta
router.delete(
  '/alerts/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const alertResult = await query(
      `SELECT user_id FROM notification_alerts WHERE id = $1`,
      [id]
    );

    if (alertResult.rows.length === 0) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Alerta no encontrada',
      };
      res.status(404).json(response);
      return;
    }

    if (alertResult.rows[0].user_id !== req.user!.userId) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'No tienes permisos para eliminar esta alerta',
      };
      res.status(403).json(response);
      return;
    }

    await query(`DELETE FROM notification_alerts WHERE id = $1`, [id]);

    const response: ApiResponse<null> = {
      success: true,
      message: 'Alerta eliminada exitosamente',
    };

    res.json(response);
  })
);

// Verificar alertas para una ubicación específica (para notificaciones push)
router.post(
  '/check',
  authenticate,
  asyncHandler(async (req, res) => {
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Latitud y longitud son requeridas',
      };
      res.status(400).json(response);
      return;
    }

    // Obtener día de la semana actual (0 = domingo)
    const currentDay = new Date().getDay();
    const currentTime = new Date().toTimeString().slice(0, 5);

    // Buscar vendedores cercanos que coincidan con las alertas del usuario
    const result = await query(
      `SELECT DISTINCT
        v.id as vendor_id,
        v.name as vendor_name,
        v.category,
        v.type,
        vl.latitude,
        vl.longitude,
        na.id as alert_id,
        na.radius_meters,
        (6371000 * acos(
          cos(radians($1)) * cos(radians(vl.latitude)) *
          cos(radians(vl.longitude) - radians($2)) +
          sin(radians($1)) * sin(radians(vl.latitude))
        )) as distance_meters
      FROM notification_alerts na
      JOIN vendors v ON (
        v.category = na.category OR
        v.type = ANY(na.vendor_types)
      )
      JOIN vendor_locations vl ON v.id = vl.vendor_id
      WHERE na.user_id = $3
        AND na.is_active = true
        AND $4 = ANY(na.days_of_week)
        AND (na.schedule_start IS NULL OR na.schedule_start <= $5)
        AND (na.schedule_end IS NULL OR na.schedule_end >= $5)
        AND vl.is_active = true
        AND v.is_active = true
      HAVING (6371000 * acos(
        cos(radians($1)) * cos(radians(vl.latitude)) *
        cos(radians(vl.longitude) - radians($2)) +
        sin(radians($1)) * sin(radians(vl.latitude))
      )) <= na.radius_meters
      ORDER BY distance_meters ASC
      LIMIT 10`,
      [latitude, longitude, req.user!.userId, currentDay, currentTime]
    );

    const response: ApiResponse<typeof result.rows> = {
      success: true,
      data: result.rows,
    };

    res.json(response);
  })
);

export default router;
