import { Router } from 'express';
import { query } from '../config/database';
import { authenticate, authorize, generateToken, optionalAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { validate } from '../middleware/validate';
import { createVendorSchema, updateVendorSchema, updateLocationSchema, toggleLocationSchema, reviewSchema } from '../schemas/vendors';
import { ApiResponse, Vendor, VendorLocation } from '../types';

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
  validate(createVendorSchema),
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
      latitude,
      longitude,
      accuracy = 10,
    } = req.body;

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

    const vendorId = result.rows[0].id;

    // Si se proporciona ubicación, guardar en vendor_locations
    if (latitude && longitude) {
      await query(
        `INSERT INTO vendor_locations (vendor_id, latitude, longitude, accuracy, is_active)
         VALUES ($1, $2, $3, $4, true)`,
        [vendorId, latitude, longitude, accuracy]
      );
    }

    let newToken: string | undefined;

    // Actualizar rol del usuario a 'seller' si era 'customer'
    if (req.user!.role === 'customer') {
      await query(`UPDATE users SET role = 'seller' WHERE id = $1`, [req.user!.userId]);
      
      // Generar nuevo token con el rol actualizado
      newToken = generateToken({
        userId: req.user!.userId,
        email: req.user!.email,
        role: 'seller'
      });
    }

    const response: ApiResponse<Vendor> = {
      success: true,
      data: result.rows[0],
      token: newToken,
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
    // Fix DoS: limitar el radio máximo a 50km para evitar queries masivos
    const MAX_RADIUS_METERS = 50000;
    const rawRadius = parseInt(radius as string);
    const radiusMeters = Math.min(isNaN(rawRadius) ? 200 : rawRadius, MAX_RADIUS_METERS);

    if (isNaN(latitude) || isNaN(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      res.status(400).json({ success: false, error: 'Coordenadas inválidas' });
      return;
    }

    // Fix bounding box: la longitud necesita ajuste por latitud
    // 1 grado de latitud ≈ 111km siempre
    // 1 grado de longitud ≈ 111km * cos(lat)
    const radiusLatDeg = radiusMeters / 111000;
    const radiusLngDeg = radiusMeters / (111000 * Math.cos((latitude * Math.PI) / 180));

    // Paginación
    const page = Math.max(1, parseInt((req.query.page as string) || '1'));
    const limit = Math.min(50, Math.max(1, parseInt((req.query.limit as string) || '20')));
    const offset = (page - 1) * limit;

    let sql = `
      SELECT * FROM (
        SELECT
          v.*,
          vl.latitude,
          vl.longitude,
          vl.accuracy,
          vl.is_active as location_active,
          (6371000 * acos(
            LEAST(1.0, GREATEST(-1.0,
              cos(radians($1)) * cos(radians(vl.latitude)) *
              cos(radians(vl.longitude) - radians($2)) +
              sin(radians($1)) * sin(radians(vl.latitude))
            ))
          )) as distance_meters
        FROM vendors v
        JOIN vendor_locations vl ON v.id = vl.vendor_id
        WHERE vl.is_active = true
          AND v.is_active = true
          AND vl.latitude  BETWEEN $1 - $4 AND $1 + $4
          AND vl.longitude BETWEEN $2 - $5 AND $2 + $5
    `;

    const params: any[] = [latitude, longitude, radiusMeters, radiusLatDeg, radiusLngDeg];
    let paramIndex = 6;

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
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(limit, offset);

    const result = await query(sql, params);

    const response: ApiResponse<typeof result.rows> = {
      success: true,
      data: result.rows,
      // @ts-ignore - campo extra de paginación
      pagination: { page, limit, count: result.rows.length },
    };

    res.json(response);
  })
);

// Listar categorías disponibles - DEBE IR ANTES de /:id
router.get(
  '/categories',
  asyncHandler(async (_req, res) => {
    const categories = [
      { id: 'fast_food', name: 'Comidas Rápidas', icon: '🍔' },
      { id: 'restaurant', name: 'Restaurantes', icon: '🍽️' },
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
  validate(updateVendorSchema),
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
  validate(updateLocationSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { latitude, longitude, accuracy = 10 } = req.body;

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

    // UPSERT: actualizar si ya existe, crear si no
    const result = await query<VendorLocation>(
      `INSERT INTO vendor_locations (vendor_id, latitude, longitude, accuracy, is_active)
       VALUES ($1, $2, $3, $4, true)
       ON CONFLICT (vendor_id) WHERE is_active = true
       DO UPDATE SET 
         latitude = EXCLUDED.latitude,
         longitude = EXCLUDED.longitude,
         accuracy = EXCLUDED.accuracy,
         updated_at = CURRENT_TIMESTAMP
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
  validate(toggleLocationSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { is_active } = req.body;

    // Verificar propiedad (solo el dueño o admin puede modificar)
    if (req.user!.role !== 'admin') {
      const ownerResult = await query(
        `SELECT user_id FROM vendors WHERE id = $1`,
        [id]
      );
      if (ownerResult.rows.length === 0 || ownerResult.rows[0].user_id !== req.user!.userId) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'No tienes permisos para modificar este vendedor',
        };
        res.status(403).json(response);
        return;
      }
    }

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
  validate(reviewSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user!.userId;

    // Insertar o actualizar reseña (UPSERT)
    await query(
      `INSERT INTO reviews (vendor_id, user_id, rating, comment)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (vendor_id, user_id) 
       DO UPDATE SET 
        rating = EXCLUDED.rating,
        comment = EXCLUDED.comment,
        created_at = CURRENT_TIMESTAMP`,
      [id, userId, rating, comment || null]
    );

    // Actualizar promedio y conteo en la tabla vendors
    const statsResult = await query(
      `SELECT COALESCE(AVG(rating), 0)::DECIMAL(2,1) as avg_rating, COUNT(*) as count
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
