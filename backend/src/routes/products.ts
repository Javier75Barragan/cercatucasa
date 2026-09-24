import { Router } from 'express';
import { query } from '../config/database';
import { authenticate, authorize } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { validate } from '../middleware/validate';
import { createProductSchema, updateProductSchema } from '../schemas/products';
import { ApiResponse, Product } from '../types';

const router = Router();

/**
 * @openapi
 * /api/products:
 *   post:
 *     tags:
 *       - Productos
 *     summary: Crear un producto
 *     description: Crea un nuevo producto asociado a un vendedor. Solo vendedores (dueños) y admins.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vendor_id
 *               - name
 *               - category
 *             properties:
 *               vendor_id:
 *                 type: string
 *                 format: uuid
 *                 example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 255
 *                 example: "Hamburguesa Clásica"
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *                 example: "Hamburguesa con carne, lechuga, tomate y queso"
 *               price:
 *                 type: number
 *                 minimum: 0
 *                 example: 8.50
 *               currency:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 3
 *                 default: "USD"
 *                 example: "USD"
 *               photos:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uri
 *                 example: ["https://example.com/photo1.jpg"]
 *               category:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *                 example: "fast_food"
 *     responses:
 *       201:
 *         description: Producto creado exitosamente
 *       400:
 *         description: Datos de entrada inválidos
 *       403:
 *         description: No tienes permisos para agregar productos a este vendedor
 *       401:
 *         description: No autorizado
 */
// Crear producto
router.post(
  '/',
  authenticate,
  authorize('seller', 'admin'),
  validate(createProductSchema),
  asyncHandler(async (req, res) => {
    const { vendor_id, name, description, price, currency = 'USD', photos = [], category } = req.body;

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

/**
 * @openapi
 * /api/products/vendor/{vendorId}:
 *   get:
 *     tags:
 *       - Productos
 *     summary: Listar productos de un vendedor
 *     description: Obtiene todos los productos asociados a un vendedor específico. Ruta pública.
 *     parameters:
 *       - in: path
 *         name: vendorId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del vendedor
 *       - in: query
 *         name: available_only
 *         schema:
 *           type: string
 *           enum: ["true", "false"]
 *           default: "true"
 *         description: Si es "true", solo devuelve productos disponibles
 *     responses:
 *       200:
 *         description: Lista de productos del vendedor
 */
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

/**
 * @openapi
 * /api/products/{id}:
 *   put:
 *     tags:
 *       - Productos
 *     summary: Actualizar un producto
 *     description: Actualiza los campos de un producto existente. Solo el vendedor dueño o admin.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del producto
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 255
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *               price:
 *                 type: number
 *                 minimum: 0
 *               currency:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 3
 *               photos:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uri
 *               category:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *               is_available:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Producto actualizado exitosamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: No tienes permisos para editar este producto
 */
// Actualizar producto
router.put(
  '/:id',
  authenticate,
  authorize('seller', 'admin'),
  validate(updateProductSchema),
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

/**
 * @openapi
 * /api/products/{id}:
 *   delete:
 *     tags:
 *       - Productos
 *     summary: Eliminar un producto
 *     description: Elimina permanentemente un producto. Solo el vendedor dueño o admin.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del producto a eliminar
 *     responses:
 *       200:
 *         description: Producto eliminado exitosamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: No tienes permisos para eliminar este producto
 */
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
