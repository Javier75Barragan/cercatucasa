import request from 'supertest';
import express from 'express';
import cors from 'cors';
import { json } from 'express';

// Mock del módulo de base de datos
jest.mock('../config/database', () => ({
  query: jest.fn(),
}));

import { query } from '../config/database';
import { UserRole } from '../types';

const mockQuery = query as jest.MockedFunction<typeof query>;


import { generateToken } from '../middleware/auth';


// Configurar variables de entorno
process.env.JWT_SECRET = 'test-secret-key-for-testing-purposes-only-32chars';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-testing-32chars!!';
process.env.JWT_EXPIRES_IN = '15m';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
process.env.NODE_ENV = 'test';

import vendorsRoutes from '../routes/vendors';
import { errorHandler } from '../middleware/errorHandler';

const app = express();
app.use(json());
app.use(cors());
app.set('trust proxy', 1);
app.use('/api/vendors', vendorsRoutes);
app.use(errorHandler);

// Datos de prueba
const mockUser = {
  userId: 'user-uuid-123',
  email: 'seller@example.com',
  role: 'seller' as UserRole,
};


const mockVendor = {
  id: 'vendor-uuid-456',
  user_id: mockUser.userId,
  name: 'Mi Tiendita',
  description: 'Vendo de todo',
  type: 'ambulant',
  category: 'groceries',
  subcategories: ['fruits', 'vegetables'],
  phone: '+573001234567',
  whatsapp: '+573001234567',
  email: 'tienda@example.com',
  website: 'https://tienda.com',
  address: 'Calle 1 # 2-3',
  schedule: { monday: { open: '08:00', close: '18:00' } },
  photos: [],
  avatar_url: null,
  rating: 4.5,
  review_count: 10,
  is_active: true,
  created_at: new Date().toISOString(),
};

const mockVendorLocation = {
  id: 'location-uuid-789',
  vendor_id: mockVendor.id,
  latitude: 7.065,
  longitude: -73.84,
  accuracy: 10,
  is_active: true,
  created_at: new Date().toISOString(),
};

describe('GET /api/vendors/me', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe devolver el negocio del usuario vendedor (200)', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [mockVendor], rowCount: 1 } as any);

    const token = generateToken(mockUser);

    const res = await request(app)
      .get('/api/vendors/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id', mockVendor.id);
    expect(res.body.data).toHaveProperty('name', mockVendor.name);
  });

  it('debe devolver null si el usuario no tiene negocio', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    const token = generateToken(mockUser);

    const res = await request(app)
      .get('/api/vendors/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeNull();
  });

  it('debe devolver 401 si no está autenticado', async () => {
    const res = await request(app).get('/api/vendors/me');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

describe('POST /api/vendors', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const validPayload = {
    name: 'Tienda Nueva',
    description: 'Una tienda nueva',
    type: 'store',
    category: 'groceries',
    phone: '+573009876543',
    latitude: 7.065,
    longitude: -73.84,
  };

  it('debe crear un vendedor exitosamente (201)', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any) // No existe vendedor previo
      .mockResolvedValueOnce({ rows: [{ ...mockVendor, name: validPayload.name }], rowCount: 1 } as any) // Insert vendor
      .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any); // Insert location


    const token = generateToken(mockUser);

    const res = await request(app)
      .post('/api/vendors')
      .set('Authorization', `Bearer ${token}`)
      .send(validPayload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data).toHaveProperty('name', validPayload.name);
  });

  it('debe devolver 400 si el usuario ya tiene un negocio', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'existing-vendor' }], rowCount: 1 } as any);

    const token = generateToken(mockUser);

    const res = await request(app)
      .post('/api/vendors')
      .set('Authorization', `Bearer ${token}`)
      .send(validPayload);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/ya tienes un negocio/i);
  });

  it('debe validar que el nombre es requerido', async () => {
    const { name: _name, ...withoutName } = validPayload;
    const token = generateToken(mockUser);

    const res = await request(app)
      .post('/api/vendors')
      .set('Authorization', `Bearer ${token}`)
      .send(withoutName);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('debe devolver 401 si no está autenticado', async () => {
    const res = await request(app)
      .post('/api/vendors')
      .send(validPayload);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

describe('GET /api/vendors/nearby', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe listar vendedores cercanos (200)', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ ...mockVendor, distance_meters: 150 }],
      rowCount: 1,
    } as any);

    const res = await request(app)
      .get('/api/vendors/nearby')
      .query({ lat: 7.065, lng: -73.84, radius: 500 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data[0]).toHaveProperty('distance_meters');
  });

  it('debe devolver 400 si falta lat o lng', async () => {
    const res = await request(app)
      .get('/api/vendors/nearby')
      .query({ lat: 7.065 }); // Falta lng

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('debe filtrar por categoría si se proporciona', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    const res = await request(app)
      .get('/api/vendors/nearby')
      .query({ lat: 7.065, lng: -73.84, category: 'groceries' });

    expect(res.status).toBe(200);
    expect(mockQuery).toHaveBeenCalled();
    // Verificar que la query incluya el filtro de categoría
    const queryCall = mockQuery.mock.calls[0];
    expect(queryCall[0]).toContain('category');
  });

  it('debe permitir búsqueda sin autenticación', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    const res = await request(app)
      .get('/api/vendors/nearby')
      .query({ lat: 7.065, lng: -73.84 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('GET /api/vendors/categories', () => {
  it('debe devolver lista de categorías (200)', async () => {
    const res = await request(app).get('/api/vendors/categories');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0]).toHaveProperty('id');
    expect(res.body.data[0]).toHaveProperty('name');
  });
});

describe('GET /api/vendors/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe devolver detalles del vendedor con productos (200)', async () => {
    const mockProducts = [
      { id: 'prod-1', name: 'Manzana', price: 2000 },
      { id: 'prod-2', name: 'Naranja', price: 1500 },
    ];

    mockQuery
      .mockResolvedValueOnce({ rows: [mockVendor], rowCount: 1 } as any) // Get vendor
      .mockResolvedValueOnce({ rows: mockProducts, rowCount: 2 } as any); // Get products

    const res = await request(app)
      .get(`/api/vendors/${mockVendor.id}`)
      .set('Authorization', `Bearer ${generateToken(mockUser)}`);


    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('vendor');
    expect(res.body.data).toHaveProperty('products');
    expect(res.body.data.products).toBeInstanceOf(Array);
  });

  it('debe devolver 404 si el vendedor no existe', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    const res = await request(app)
      .get('/api/vendors/nonexistent-id')
      .set('Authorization', `Bearer ${generateToken(mockUser)}`);


    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('debe permitir acceso sin autenticación', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [mockVendor], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    const res = await request(app).get(`/api/vendors/${mockVendor.id}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('PUT /api/vendors/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const updatePayload = {
    name: 'Tienda Actualizada',
    description: 'Nueva descripción',
  };

  it('debe actualizar un vendedor (200)', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ user_id: mockUser.userId }], rowCount: 1 } as any) // Check owner
      .mockResolvedValueOnce({ rows: [{ ...mockVendor, ...updatePayload }], rowCount: 1 } as any); // Update

    const token = generateToken(mockUser);

    const res = await request(app)
      .put(`/api/vendors/${mockVendor.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updatePayload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('name', updatePayload.name);
  });

  it('debe devolver 403 si no es dueño', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ user_id: 'different-user' }], rowCount: 1 } as any);

    const token = generateToken(mockUser);

    const res = await request(app)
      .put(`/api/vendors/${mockVendor.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updatePayload);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('debe validar campos permitidos (ignora campos no permitidos)', async () => {
    const payloadWithInvalid = {
      ...updatePayload,
      is_active: false, // Campo no permitido
    };

    mockQuery
      .mockResolvedValueOnce({ rows: [{ user_id: mockUser.userId }], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [mockVendor], rowCount: 1 } as any);

    const token = generateToken(mockUser);

    const res = await request(app)
      .put(`/api/vendors/${mockVendor.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(payloadWithInvalid);

    expect(res.status).toBe(200);
    // El campo is_active no debe incluirse en la query
    const queryCall = mockQuery.mock.calls[1];
    expect(queryCall[0]).not.toContain('is_active');
  });
});

describe('POST /api/vendors/:id/location', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const locationPayload = {
    latitude: 7.07,
    longitude: -73.85,
    accuracy: 15,
  };

  it('debe actualizar ubicación del vendedor (200)', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ user_id: mockUser.userId }], rowCount: 1 } as any) // Check owner
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any) // Deactivate old
      .mockResolvedValueOnce({ rows: [{ ...mockVendorLocation, ...locationPayload }], rowCount: 1 } as any); // Insert new


    const token = generateToken(mockUser);

    const res = await request(app)
      .post(`/api/vendors/${mockVendor.id}/location`)
      .set('Authorization', `Bearer ${token}`)
      .send(locationPayload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('latitude', locationPayload.latitude);
  });

  it('debe devolver 403 si no es dueño', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ user_id: 'different-user' }], rowCount: 1 } as any);

    const token = generateToken(mockUser);

    const res = await request(app)
      .post(`/api/vendors/${mockVendor.id}/location`)
      .set('Authorization', `Bearer ${token}`)
      .send(locationPayload);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});

describe('PATCH /api/vendors/:id/location/toggle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe activar la ubicación del vendedor (200)', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ user_id: mockUser.userId }], rowCount: 1 } as any) // Check owner
      .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any); // Update location

    const token = generateToken(mockUser);

    const res = await request(app)
      .patch(`/api/vendors/${mockVendor.id}/location/toggle`)
      .set('Authorization', `Bearer ${token}`)
      .send({ is_active: true });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/ubicación activada/i);
  });

  it('debe desactivar la ubicación del vendedor (200)', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ user_id: mockUser.userId }], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);

    const token = generateToken(mockUser);

    const res = await request(app)
      .patch(`/api/vendors/${mockVendor.id}/location/toggle`)
      .set('Authorization', `Bearer ${token}`)
      .send({ is_active: false });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/ubicación desactivada/i);
  });
});

describe('POST /api/vendors/:id/reviews', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const reviewPayload = {
    rating: 5,
    comment: 'Excelente servicio',
  };

  it('debe crear una reseña y actualizar rating (200)', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any) // Insert review
      .mockResolvedValueOnce({
        rows: [{ avg_rating: 4.7, count: 11 }],
        rowCount: 1,
      } as any) // Get stats
      .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any); // Update vendor rating

    const token = generateToken(mockUser);

    const res = await request(app)
      .post(`/api/vendors/${mockVendor.id}/reviews`)
      .set('Authorization', `Bearer ${token}`)
      .send(reviewPayload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('rating', 4.7);
    expect(res.body.data).toHaveProperty('review_count', 11);
  });

  it('debe validar que rating esté entre 1 y 5', async () => {
    const token = generateToken(mockUser);

    const res = await request(app)
      .post(`/api/vendors/${mockVendor.id}/reviews`)
      .set('Authorization', `Bearer ${token}`)
      .send({ rating: 10, comment: 'Muy bueno' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('debe devolver 401 si no está autenticado', async () => {
    const res = await request(app)
      .post(`/api/vendors/${mockVendor.id}/reviews`)
      .send(reviewPayload);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
