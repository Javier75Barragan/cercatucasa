import { Router } from 'express';
import { query } from '../config/database';
import { authenticate, authorize } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { ApiResponse, Product } from '../types';

const router = Router();

// Crear producto
router.post(
  '/',
  authenticate,
  authorize('seller', 'admin'),
  asyncHandler(async (req, res) => {
    const { vendor_id, name, description, price, currency = 'USD', photos = [], category } = req.body;

    if (!vendor_id || !name || !category) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'ID del vendedor, nombre y categoría son requeridos',
      };
      res.status(400).json(response);
      return;
    }

    // Verificar propiedad
    if (req.user!.role !== 'admin') {
      const ownerResult = await query(
        `SELECT user_id FROM vendors WHERE id = $1`,
        [vendor_id]
      );
      if (ownerResult.rows.length === 0 || ownerResult.rows[0].user_id !== req.user!.userId) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'No tienes permisos para agregar productos a este vendedor',
        };
        res.status(403).json(response);
        return;
      }
    }

    const result = await query<Product>(
      `INSERT INTO products (vendor_id, name, description, price, currency, photos, category)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [vendor_id, name, description, price, currency, photos, category]
    );

    const response: ApiResponse<Product> = {
      success: true,
      data: result.rows[0],
      message: 'Producto creado exitosamente',
    };

    res.status(201).json(response);
  })
);

// Listar productos de un vendedor
router.get(
  '/vendor/:vendorId',
  asyncHandler(async (req, res) => {
    const { vendorId } = req.params;
    const { available_only = 'true' } = req.query;

    let sql = `SELECT * FROM products WHERE vendor_id = $1`;
    const params: any[] = [vendorId];

    if (available_only === 'true') {
      sql += ` AND is_available = true`;
    }

    sql += ` ORDER BY created_at DESC`;

    const result = await query<Product>(sql, params);

    const response: ApiResponse<Product[]> = {
      success: true,
      data: result.rows,
    };

    res.json(response);
  })
);

// Actualizar producto
router.put(
  '/:id',
  authenticate,
  authorize('seller', 'admin'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, description, price, currency, photos, category, is_available } = req.body;

    // Verificar propiedad
    if (req.user!.role !== 'admin') {
      const productResult = await query(
        `SELECT p.*, v.user_id
         FROM products p
         JOIN vendors v ON p.vendor_id = v.id
         WHERE p.id = $1`,
        [id]
      );
      if (productResult.rows.length === 0 || productResult.rows[0].user_id !== req.user!.userId) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'No tienes permisos para editar este producto',
        };
        res.status(403).json(response);
        return;
      }
    }

    const result = await query<Product>(
      `UPDATE products
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           price = COALESCE($3, price),
           currency = COALESCE($4, currency),
           photos = COALESCE($5, photos),
           category = COALESCE($6, category),
           is_available = COALESCE($7, is_available),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $8
       RETURNING *`,
      [name, description, price, currency, photos, category, is_available, id]
    );

    const response: ApiResponse<Product> = {
      success: true,
      data: result.rows[0],
      message: 'Producto actualizado exitosamente',
    };

    res.json(response);
  })
);

// Eliminar producto (soft delete marcando como no disponible)
router.delete(
  '/:id',
  authenticate,
  authorize('seller', 'admin'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (req.user!.role !== 'admin') {
      const productResult = await query(
        `SELECT p.*, v.user_id
         FROM products p
         JOIN vendors v ON p.vendor_id = v.id
         WHERE p.id = $1`,
        [id]
      );
      if (productResult.rows.length === 0 || productResult.rows[0].user_id !== req.user!.userId) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'No tienes permisos para eliminar este producto',
        };
        res.status(403).json(response);
        return;
      }
    }

    await query(`DELETE FROM products WHERE id = $1`, [id]);

    const response: ApiResponse<null> = {
      success: true,
      message: 'Producto eliminado exitosamente',
    };

    res.json(response);
  })
);

export default router;
