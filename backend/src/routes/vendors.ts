import { Router } from 'express';
import { query } from '../config/database';
import { authenticate, authorize } from '../middleware/auth';
import { optionalAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { ApiResponse, Vendor, VendorLocation, VendorSchedule } from '../types';

const router = Router();

// Obtener el negocio del usuario actual
router.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    const result = await query<Vendor>(
      `SELECT v.*, vl.latitude, vl.longitude, vl.is_active as online_status
       FROM vendors v
       LEFT JOIN vendor_locations vl ON v.id = vl.vendor_id AND vl.is_active = true
       WHERE v.user_id = $1
       LIMIT 1`,
      [req.user!.userId]
    );

    const response: ApiResponse<Vendor | null> = {
      success: true,
      data: result.rows.length > 0 ? result.rows[0] : null,
    };

    res.json(response);
  })
);

// Crear vendedor/tienda
router.post(
  '/',
  authenticate,
  authorize('customer', 'seller', 'admin'),
  asyncHandler(async (req, res) => {
    // Verificar si ya tiene un negocio
    const existing = await query('SELECT id FROM vendors WHERE user_id = $1', [req.user!.userId]);
    if (existing.rows.length > 0) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Ya tienes un negocio registrado',
      };
      res.status(400).json(response);
      return;
    }

    const {
      name,
      description,
      type,
      category,
      subcategories = [],
      phone,
      whatsapp,
      email,
      website,
      address,
      schedule,
    } = req.body;

    // Validaciones
    if (!name || !type || !category || !phone) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Nombre, tipo, categoría y teléfono son requeridos',
      };
      res.status(400).json(response);
      return;
    }

    const result = await query<Vendor>(
      `INSERT INTO vendors (
        user_id, name, description, type, category, subcategories,
        phone, whatsapp, email, website, address, schedule
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        req.user!.userId,
        name,
        description,
        type,
        category,
        subcategories,
        phone,
        whatsapp,
        email,
        website,
        address,
        JSON.stringify(schedule),
      ]
    );

    // Actualizar rol del usuario a 'seller' si era 'customer'
    if (req.user!.role === 'customer') {
      await query(`UPDATE users SET role = 'seller' WHERE id = $1`, [req.user!.userId]);
    }

    const response: ApiResponse<Vendor> = {
      success: true,
      data: result.rows[0],
      message: 'Vendedor creado exitosamente',
    };

    res.status(201).json(response);
  })
);

// Listar vendedores cercanos
router.get(
  '/nearby',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const { lat, lng, radius = 200, category, type } = req.query;

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

    // Fórmula de Haversine para calcular distancia
    // Convierte radio a grados aproximados (1 grado ≈ 111km)
    const radiusDegrees = radiusMeters / 111000;

    let sql = `
      SELECT * FROM (
        SELECT
          v.*,
          vl.latitude,
          vl.longitude,
          vl.accuracy,
          vl.is_active as location_active,
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
    `;

    const params: any[] = [latitude, longitude, radiusMeters, radiusDegrees];
    let paramIndex = 5;

    if (category) {
      sql += ` AND v.category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (type) {
      sql += ` AND v.type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    sql += `
      ) AS nearby_vendors
      WHERE distance_meters <= $3
      ORDER BY distance_meters ASC
    `;

    const result = await query(sql, params);

    const response: ApiResponse<typeof result.rows> = {
      success: true,
      data: result.rows,
    };

    res.json(response);
  })
);

// Listar categorías disponibles - DEBE IR ANTES de /:id
router.get(
  '/categories',
  asyncHandler(async (_req, res) => {
    const categories = [
      { id: 'fruits_vegetables', name: 'Frutas y Verduras', icon: '🥬' },
      { id: 'dairy', name: 'Lácteos', icon: '🥛' },
      { id: 'bakery', name: 'Panadería', icon: '🥖' },
      { id: 'meat', name: 'Carnicería', icon: '🥩' },
      { id: 'pharmacy', name: 'Farmacia', icon: '💊' },
      { id: 'groceries', name: 'Abarrotes', icon: '🛒' },
      { id: 'messenger', name: 'Mensajería', icon: '📦' },
      { id: 'hardware', name: 'Ferretería', icon: '🔧' },
      { id: 'stationery', name: 'Papelería', icon: '📝' },
      { id: 'cleaning', name: 'Productos de limpieza', icon: '🧽' },
      { id: 'garbage_collection', name: 'Recolección de Basura', icon: '🗑️' },
      { id: 'utility_delivery', name: 'Entrega de Recibos', icon: '📄' },
      { id: 'telecom', name: 'Telecomunicaciones', icon: '📱' },
      { id: 'water_delivery', name: 'Agua Potable', icon: '💧' },
      { id: 'gas_delivery', name: 'Gas Domiciliario', icon: '🔥' },
      { id: 'municipal', name: 'Servicios Municipales', icon: '🏛️' },
      { id: 'other', name: 'Otros', icon: '📍' },
    ];

    const response: ApiResponse<typeof categories> = {
      success: true,
      data: categories,
    };

    res.json(response);
  })
);

// Obtener vendedor por ID
router.get(
  '/:id',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const vendorResult = await query<Vendor>(
      `SELECT v.*,
        vl.latitude, vl.longitude, vl.accuracy, vl.updated_at as location_updated
       FROM vendors v
       LEFT JOIN vendor_locations vl ON v.id = vl.vendor_id
       WHERE v.id = $1`,
      [id]
    );

    if (vendorResult.rows.length === 0) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Vendedor no encontrado',
      };
      res.status(404).json(response);
      return;
    }

    // Obtener productos
    const productsResult = await query(
      `SELECT * FROM products WHERE vendor_id = $1 AND is_available = true`,
      [id]
    );

    const response: ApiResponse<{ vendor: typeof vendorResult.rows[0]; products: typeof productsResult.rows }> = {
      success: true,
      data: {
        vendor: vendorResult.rows[0],
        products: productsResult.rows,
      },
    };

    res.json(response);
  })
);




// Actualizar vendedor
router.put(
  '/:id',
  authenticate,
  authorize('seller', 'admin'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user!.userId;

    // Verificar propiedad (solo admin o el dueño puede editar)
    if (req.user!.role !== 'admin') {
      const ownerResult = await query(
        `SELECT user_id FROM vendors WHERE id = $1`,
        [id]
      );
      if (ownerResult.rows.length === 0 || ownerResult.rows[0].user_id !== userId) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'No tienes permisos para editar este vendedor',
        };
        res.status(403).json(response);
        return;
      }
    }

    const fields = req.body;
    const allowedFields = [
      'name', 'description', 'category', 'subcategories', 'phone',
      'whatsapp', 'email', 'website', 'address', 'schedule', 'photos', 'avatar_url'
    ];

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(fields)) {
      if (allowedFields.includes(key)) {
        updates.push(`${key} = $${paramIndex}`);
        values.push(key === 'schedule' ? JSON.stringify(value) : value);
        paramIndex++;
      }
    }

    if (updates.length === 0) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'No hay campos válidos para actualizar',
      };
      res.status(400).json(response);
      return;
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await query<Vendor>(
      `UPDATE vendors SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    const response: ApiResponse<Vendor> = {
      success: true,
      data: result.rows[0],
      message: 'Vendedor actualizado exitosamente',
    };

    res.json(response);
  })
);

// Actualizar ubicación (para vendedores)
router.post(
  '/:id/location',
  authenticate,
  authorize('seller', 'admin'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { latitude, longitude, accuracy = 10 } = req.body;

    if (latitude === undefined || longitude === undefined) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Latitud y longitud son requeridas',
      };
      res.status(400).json(response);
      return;
    }

    // Verificar propiedad
    if (req.user!.role !== 'admin') {
      const ownerResult = await query(
        `SELECT user_id FROM vendors WHERE id = $1`,
        [id]
      );
      if (ownerResult.rows.length === 0 || ownerResult.rows[0].user_id !== req.user!.userId) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'No tienes permisos',
        };
        res.status(403).json(response);
        return;
      }
    }

    // Desactivar ubicaciones anteriores
    await query(
      `UPDATE vendor_locations SET is_active = false WHERE vendor_id = $1`,
      [id]
    );

    // Insertar nueva ubicación
    const result = await query<VendorLocation>(
      `INSERT INTO vendor_locations (vendor_id, latitude, longitude, accuracy, is_active)
       VALUES ($1, $2, $3, $4, true)
       RETURNING *`,
      [id, latitude, longitude, accuracy]
    );

    const response: ApiResponse<VendorLocation> = {
      success: true,
      data: result.rows[0],
      message: 'Ubicación actualizada',
    };

    res.json(response);
  })
);

// Activar/desactivar ubicación
router.patch(
  '/:id/location/toggle',
  authenticate,
  authorize('seller', 'admin'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { is_active } = req.body;

    await query(
      `UPDATE vendor_locations SET is_active = $1 WHERE vendor_id = $2`,
      [is_active, id]
    );

    const response: ApiResponse<null> = {
      success: true,
      message: is_active ? 'Ubicación activada' : 'Ubicación desactivada',
    };

    res.json(response);
  })
);

// Calificar un vendedor
router.post(
  '/:id/reviews',
  authenticate,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user!.userId;

    if (!rating || rating < 1 || rating > 5) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'La calificación debe estar entre 1 y 5',
      };
      res.status(400).json(response);
      return;
    }

    // Insertar reseña
    await query(
      `INSERT INTO reviews (vendor_id, user_id, rating, comment)
       VALUES ($1, $2, $3, $4)`,
      [id, userId, rating, comment]
    );

    // Actualizar promedio y conteo en la tabla vendors
    const statsResult = await query(
      `SELECT AVG(rating)::DECIMAL(2,1) as avg_rating, COUNT(*) as count
       FROM reviews
       WHERE vendor_id = $1`,
      [id]
    );

    const { avg_rating, count } = statsResult.rows[0];

    await query(
      `UPDATE vendors SET rating = $1, review_count = $2 WHERE id = $3`,
      [avg_rating, count, id]
    );

    const response: ApiResponse<{ rating: number; review_count: number }> = {
      success: true,
      data: { rating: Number(avg_rating), review_count: Number(count) },
      message: '¡Gracias por tu calificación!',
    };

    res.json(response);
  })
);

export default router;
