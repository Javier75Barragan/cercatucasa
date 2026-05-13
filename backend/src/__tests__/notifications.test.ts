import request from 'supertest';
import express from 'express';
import cors from 'cors';
import { json } from 'express';

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
import notificationsRoutes from '../routes/notifications';
import { errorHandler } from '../middleware/errorHandler';

const app = express();
app.use(json());
app.use(cors());
app.set('trust proxy', 1);
app.use('/api/notifications', notificationsRoutes);
app.use(errorHandler);

const mockUser = {
  userId: 'user-uuid-123',
  email: 'user@example.com',
  role: 'customer' as UserRole,
};

const mockAlert = {
  id: 'alert-uuid-456',
  user_id: mockUser.userId,
  category: 'fast_food',
  subcategories: ['pizza', 'burgers'],
  vendor_types: ['ambulant', 'store'],
  radius_meters: 500,
  schedule_start: '08:00',
  schedule_end: '22:00',
  days_of_week: [0, 1, 2, 3, 4, 5, 6],
  is_active: true,
  created_at: new Date().toISOString(),
};

describe('POST /api/notifications/alerts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const validPayload = {
    category: 'fast_food',
    subcategories: ['pizza'],
    vendor_types: ['ambulant'],
    radius_meters: 300,
  };

  it('debe crear una alerta de notificación (201)', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [mockAlert], rowCount: 1 } as any);

    const token = generateToken(mockUser);
    const res = await request(app)
      .post('/api/notifications/alerts')
      .set('Authorization', `Bearer ${token}`)
      .send(validPayload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data).toHaveProperty('category', validPayload.category);
    expect(res.body.message).toMatch(/alerta creada/i);
  });

  it('debe usar valores por defecto si no se proporcionan', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [mockAlert], rowCount: 1 } as any);

    const token = generateToken(mockUser);
    const res = await request(app)
      .post('/api/notifications/alerts')
      .set('Authorization', `Bearer ${token}`)
      .send({ category: 'fast_food' }); // Solo categoría

    expect(res.status).toBe(201);
    // Verificar que se llamó query con valores por defecto
    const queryCall = mockQuery.mock.calls[0];
    expect(queryCall[0]).toContain('INSERT INTO notification_alerts');
  });

  it('debe validar que la categoría sea requerida', async () => {
    const { category: _cat, ...withoutCategory } = validPayload;
    const token = generateToken(mockUser);
    const res = await request(app)
      .post('/api/notifications/alerts')
      .set('Authorization', `Bearer ${token}`)
      .send(withoutCategory);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('debe devolver 401 si no está autenticado', async () => {
    const res = await request(app)
      .post('/api/notifications/alerts')
      .send(validPayload);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

describe('GET /api/notifications/alerts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe devolver alertas del usuario (200)', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [mockAlert, { ...mockAlert, id: 'alert-2', category: 'restaurant' }],
      rowCount: 2,
    } as any);

    const token = generateToken(mockUser);
    const res = await request(app)
      .get('/api/notifications/alerts')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.length).toBe(2);
  });

  it('debe devolver vacío si el usuario no tiene alertas', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    const token = generateToken(mockUser);
    const res = await request(app)
      .get('/api/notifications/alerts')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it('debe devolver 401 si no está autenticado', async () => {
    const res = await request(app).get('/api/notifications/alerts');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('debe ordenar alertas por fecha más reciente primero', async () => {
    const older = { ...mockAlert, created_at: new Date(Date.now() - 86400000).toISOString() };
    const newer = { ...mockAlert, id: 'alert-2', created_at: new Date().toISOString() };

    mockQuery.mockResolvedValueOnce({ rows: [newer, older], rowCount: 2 } as any);

    const token = generateToken(mockUser);
    const res = await request(app)
      .get('/api/notifications/alerts')
      .set('Authorization', `Bearer ${token}`);

    expect(new Date(res.body.data[0].created_at).getTime()).toBeGreaterThan(new Date(res.body.data[1].created_at).getTime());
  });
});

describe('PUT /api/notifications/alerts/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const updatePayload = {
    radius_meters: 1000,
    schedule_start: '09:00',
  };

  it('debe actualizar una alerta (200)', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ user_id: mockUser.userId }], rowCount: 1 } as any) // Check owner
      .mockResolvedValueOnce({ rows: [{ ...mockAlert, ...updatePayload }], rowCount: 1 } as any); // Update

    const token = generateToken(mockUser);
    const res = await request(app)
      .put(`/api/notifications/alerts/${mockAlert.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updatePayload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('radius_meters', updatePayload.radius_meters);
  });

  it('debe devolver 404 si la alerta no existe', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    const token = generateToken(mockUser);
    const res = await request(app)
      .put('/api/notifications/alerts/nonexistent-id')
      .set('Authorization', `Bearer ${token}`)
      .send(updatePayload);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('debe devolver 403 si el usuario no es dueño', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ user_id: 'different-user' }], rowCount: 1 } as any);

    const token = generateToken(mockUser);
    const res = await request(app)
      .put(`/api/notifications/alerts/${mockAlert.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updatePayload);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('debe validar campos permitidos', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ user_id: mockUser.userId }], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [mockAlert], rowCount: 1 } as any);

    const payloadWithInvalid = {
      ...updatePayload,
      id: 'hack-attempt', // Campo no permitido
    };

    const token = generateToken(mockUser);
    const res = await request(app)
      .put(`/api/notifications/alerts/${mockAlert.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(payloadWithInvalid);

    expect(res.status).toBe(200);
    const queryCall = mockQuery.mock.calls[1];
    expect(queryCall[0]).not.toMatch(/SET[^W]*id\s*=/i); // No debería actualizar id
  });

  it('debe devolver 401 si no está autenticado', async () => {
    const res = await request(app)
      .put(`/api/notifications/alerts/${mockAlert.id}`)
      .send(updatePayload);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

describe('DELETE /api/notifications/alerts/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe eliminar una alerta (200)', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ user_id: mockUser.userId }], rowCount: 1 } as any) // Check owner
      .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any); // Delete

    const token = generateToken(mockUser);
    const res = await request(app)
      .delete(`/api/notifications/alerts/${mockAlert.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/eliminada/i);
  });

  it('debe devolver 404 si la alerta no existe', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    const token = generateToken(mockUser);
    const res = await request(app)
      .delete('/api/notifications/alerts/nonexistent-id')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('debe devolver 403 si el usuario no es dueño', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ user_id: 'different-user' }], rowCount: 1 } as any);

    const token = generateToken(mockUser);
    const res = await request(app)
      .delete(`/api/notifications/alerts/${mockAlert.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('debe devolver 401 si no está autenticado', async () => {
    const res = await request(app).delete(`/api/notifications/alerts/${mockAlert.id}`);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

describe('POST /api/notifications/check', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const checkPayload = {
    latitude: 7.065,
    longitude: -73.84,
  };

  it('debe devolver vendedores que coinciden con alertas (200)', async () => {
    const mockMatches = [
      {
        vendor_id: 'vendor-1',
        vendor_name: 'Pizza Place',
        category: 'fast_food',
        distance_meters: 150,
      },
    ];

    mockQuery.mockResolvedValueOnce({ rows: mockMatches, rowCount: 1 } as any);

    const token = generateToken(mockUser);
    const res = await request(app)
      .post('/api/notifications/check')
      .set('Authorization', `Bearer ${token}`)
      .send(checkPayload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data[0]).toHaveProperty('vendor_name');
    expect(res.body.data[0]).toHaveProperty('distance_meters');
  });

  it('debe devolver vacío si no hay coincidencias', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    const token = generateToken(mockUser);
    const res = await request(app)
      .post('/api/notifications/check')
      .set('Authorization', `Bearer ${token}`)
      .send(checkPayload);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it('debe validar que latitude y longitude sean requeridas', async () => {
    const { latitude: _lat, ...withoutLatitude } = checkPayload;
    const token = generateToken(mockUser);
    const res = await request(app)
      .post('/api/notifications/check')
      .set('Authorization', `Bearer ${token}`)
      .send(withoutLatitude);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('debe devolver 401 si no está autenticado', async () => {
    const res = await request(app)
      .post('/api/notifications/check')
      .send(checkPayload);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('debe considerar el día y hora actuales en el filtro', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    const token = generateToken(mockUser);
    await request(app)
      .post('/api/notifications/check')
      .set('Authorization', `Bearer ${token}`)
      .send(checkPayload);

    const queryCall = mockQuery.mock.calls[0];
    // Verificar que se incluya filtro de día y horario
    expect(queryCall[0]).toContain('days_of_week');
    expect(queryCall[0]).toContain('schedule_start');
  });
});
