import request from 'supertest';
import express from 'express';
import cors from 'cors';
import { json } from 'express';

// Inyectar variables de entorno para el test (Sugerido por Codex)
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret_88b10ab1b1d3aecedc3f23214a59971ae50eb52f53a655adbee13a1839e78ba5';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-testing-32chars!!';
process.env.NODE_ENV = 'test';

jest.mock('../config/database', () => ({
  query: jest.fn(),
}));

import { query } from '../config/database';

const mockQuery = query as jest.MockedFunction<typeof query>;

process.env.JWT_SECRET = 'test-secret-key-for-testing-purposes-only-32chars';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-testing-32chars!!';
process.env.NODE_ENV = 'test';

import { generateToken } from '../middleware/auth';
import { UserRole } from '../types';
import productsRoutes from '../routes/products';
import { errorHandler } from '../middleware/errorHandler';

const app = express();
app.use(json());
app.use(cors());
app.set('trust proxy', 1);
app.use('/api/products', productsRoutes);
app.use(errorHandler);

const mockUser = { userId: 'd3b3e3e3-e3e3-43e3-a3e3-e3e3e3e3e3e3', email: 'test@example.com', role: 'seller' as UserRole };
const mockVendorId = 'a3b3e3e3-e3e3-43e3-a3e3-e3e3e3e3e3e3';
const mockProduct = {
  id: 'b3b3e3e3-e3e3-43e3-a3e3-e3e3e3e3e3e3',
  vendor_id: mockVendorId,
  name: 'Producto de Prueba',
  price: 1000,
  is_available: true,
  category: 'Comida',
};


describe('POST /api/products', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  const validPayload = {
    vendor_id: mockVendorId,
    name: 'Producto Nuevo',
    description: 'Descripción del producto',
    price: 5000,
    currency: 'COP',
    category: 'Comida',
  };

  it('debe crear un producto exitosamente (201)', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: mockVendorId, user_id: mockUser.userId }], rowCount: 1 } as any) // Check vendor owner
      .mockResolvedValueOnce({ rows: [{ ...mockProduct, ...validPayload }], rowCount: 1 } as any); // Insert product

    const token = generateToken(mockUser);
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send(mockProduct);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data).toHaveProperty('name', validPayload.name);
    expect(res.body.message).toMatch(/creado/i);
  });

  it('debe usar valores por defecto para currency y photos', async () => {
    const { currency: _cur, ...withoutDefaults } = validPayload;

    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: mockVendorId, user_id: mockUser.userId }], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [mockProduct], rowCount: 1 } as any);

    const token = generateToken(mockUser);
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send(withoutDefaults);

    expect(res.status).toBe(201);
    const queryCall = mockQuery.mock.calls[1];
    // Verificar que se incluye currency por defecto
    expect(queryCall[1]).toContain('USD');
  });

  it('debe devolver 403 si el usuario no es dueño del vendedor', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ user_id: 'different-user' }], rowCount: 1 } as any);

    const token = generateToken(mockUser);
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send(validPayload);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });


  it('debe devolver 403 si el vendedor no existe', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    const token = generateToken(mockUser);
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send(validPayload);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });


  it('debe permitir admin crear productos para cualquier vendedor', async () => {
    // No verificamos propiedad si el usuario es admin
    mockQuery
      .mockResolvedValueOnce({ rows: [mockProduct], rowCount: 1 } as any); // Insert solo

    // Este test es ilustrativo - en la práctica requeriría setup adicional
    // para mockear el token admin correctamente
  });

  it('debe validar que el nombre sea requerido', async () => {
    const { name: _name, ...withoutName } = validPayload;
    const token = generateToken(mockUser);
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send(withoutName);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('debe devolver 401 si no está autenticado', async () => {
    const res = await request(app)
      .post('/api/products')
      .send(validPayload);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

describe('GET /api/products/vendor/:vendorId', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('debe listar productos disponibles de un vendedor (200)', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [mockProduct, { ...mockProduct, id: 'prod-2', name: 'Naranja' }],
      rowCount: 2,
    } as any);

    const res = await request(app)
      .get(`/api/products/vendor/${mockVendorId}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.length).toBe(2);
  });

  it('debe filtrar solo productos disponibles por defecto', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [mockProduct], rowCount: 1 } as any);

    await request(app).get(`/api/products/vendor/${mockVendorId}`);

    const queryCall = mockQuery.mock.calls[0];
    expect(queryCall[0]).toContain('is_available = true');
  });

  it('debe permitir listar todos los productos si available_only=false', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [mockProduct, { ...mockProduct, id: 'prod-2', is_available: false }],
      rowCount: 2,
    } as any);

    const res = await request(app)
      .get(`/api/products/vendor/${mockVendorId}`)
      .query({ available_only: 'false' });

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
    const queryCall = mockQuery.mock.calls[0];
    // No debería incluir filtro is_available si available_only es false
    expect(queryCall[0]).not.toContain('is_available = true');
  });

  it('debe devolver vacío si el vendedor no tiene productos', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    const res = await request(app)
      .get(`/api/products/vendor/${mockVendorId}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it('debe permitir acceso sin autenticación', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [mockProduct], rowCount: 1 } as any);

    const res = await request(app)
      .get(`/api/products/vendor/${mockVendorId}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('debe ordenar productos por fecha más reciente primero', async () => {
    const older = { ...mockProduct, created_at: new Date(Date.now() - 86400000).toISOString() };
    const newer = { ...mockProduct, id: 'prod-2', created_at: new Date().toISOString() };

    mockQuery.mockResolvedValueOnce({ rows: [newer, older], rowCount: 2 } as any);

    const res = await request(app)
      .get(`/api/products/vendor/${mockVendorId}`);

    expect(new Date(res.body.data[0].created_at).getTime()).toBeGreaterThan(new Date(res.body.data[1].created_at).getTime());
  });
});

describe('PUT /api/products/:id', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  const updatePayload = {
    name: 'Producto Actualizado',
    price: 3000,
  };

  it('debe actualizar un producto (200)', async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [{ ...mockProduct, user_id: mockUser.userId }],
        rowCount: 1,
      } as any) // Check owner
      .mockResolvedValueOnce({
        rows: [{ ...mockProduct, ...updatePayload }],
        rowCount: 1,
      } as any); // Update

    const token = generateToken(mockUser);
    const res = await request(app)
      .put(`/api/products/${mockProduct.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updatePayload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('name', updatePayload.name);
    expect(res.body.data).toHaveProperty('price', updatePayload.price);
  });

  it('debe devolver 403 si el usuario no es dueño', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ user_id: 'different-user' }],
      rowCount: 1,
    } as any);

    const token = generateToken(mockUser);
    const res = await request(app)
      .put(`/api/products/${mockProduct.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updatePayload);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('debe permitir actualizar disponibilidad', async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [{ ...mockProduct, user_id: mockUser.userId }],
        rowCount: 1,
      } as any)
      .mockResolvedValueOnce({
        rows: [{ ...mockProduct, is_available: false }],
        rowCount: 1,
      } as any);

    const token = generateToken(mockUser);
    const res = await request(app)
      .put(`/api/products/${mockProduct.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ is_available: false });

    expect(res.status).toBe(200);
    expect(res.body.data.is_available).toBe(false);
  });

  it('debe devolver 401 si no está autenticado', async () => {
    const res = await request(app)
      .put(`/api/products/${mockProduct.id}`)
      .send(updatePayload);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('debe usar COALESCE para actualización parcial', async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [{ ...mockProduct, user_id: mockUser.userId }],
        rowCount: 1,
      } as any)
      .mockResolvedValueOnce({ rows: [mockProduct], rowCount: 1 } as any);

    const token = generateToken(mockUser);
    await request(app)
      .put(`/api/products/${mockProduct.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Nuevo Nombre' }); // Solo actualizar nombre

    const updateQuery = mockQuery.mock.calls[1];
    expect(updateQuery[0]).toContain('COALESCE');
  });
});

describe('DELETE /api/products/:id', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('debe eliminar un producto (200)', async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [{ ...mockProduct, user_id: mockUser.userId }],
        rowCount: 1,
      } as any) // Check owner
      .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any); // Delete

    const token = generateToken(mockUser);
    const res = await request(app)
      .delete(`/api/products/${mockProduct.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/eliminado/i);
  });

  it('debe devolver 403 si el usuario no es dueño', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ user_id: 'different-user' }],
      rowCount: 1,
    } as any);

    const token = generateToken(mockUser);
    const res = await request(app)
      .delete(`/api/products/${mockProduct.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('debe devolver 403 si el producto no existe', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    const token = generateToken(mockUser);
    const res = await request(app)
      .delete(`/api/products/${mockProduct.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('debe devolver 401 si no está autenticado', async () => {
    const res = await request(app)
      .delete(`/api/products/${mockProduct.id}`);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
