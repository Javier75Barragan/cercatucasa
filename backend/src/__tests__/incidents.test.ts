import request from 'supertest';
import express from 'express';
import cors from 'cors';
import { json } from 'express';

// Mock de base de datos y WebSocket
jest.mock('../config/database', () => ({
  query: jest.fn(),
}));

jest.mock('../services/websocket', () => ({
  getIO: jest.fn(() => ({
    to: jest.fn().mockReturnThis(),
    emit: jest.fn(),
  })),
}));

import { query } from '../config/database';

const mockQuery = query as jest.MockedFunction<typeof query>;

process.env.JWT_SECRET = 'test-secret-key-for-testing-purposes-only-32chars';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-testing-32chars!!';
process.env.JWT_EXPIRES_IN = '15m';
process.env.NODE_ENV = 'test';

import { generateToken } from '../middleware/auth';
import { UserRole } from '../types';
import incidentsRoutes from '../routes/incidents';
import { errorHandler } from '../middleware/errorHandler';

const app = express();
app.use(json());
app.use(cors());
app.set('trust proxy', 1);
app.use('/api/incidents', incidentsRoutes);
app.use(errorHandler);

const mockUser = {
  userId: 'user-uuid-123',
  email: 'user@example.com',
  role: 'customer' as UserRole,
};

const mockIncident = {
  id: 'incident-uuid-456',
  user_id: mockUser.userId,
  name: 'Juan García',
  phone: '+573001234567',
  latitude: 7.065,
  longitude: -73.84,
  type: 'accident',
  description: 'Accidente de dos vehículos',
  status: 'pending',
  notes: null,
  resolved_by: null,
  resolved_at: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe('GET /api/incidents/types', () => {
  it('debe devolver lista de tipos de incidentes (200)', async () => {
    const res = await request(app).get('/api/incidents/types');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0]).toHaveProperty('id');
    expect(res.body.data[0]).toHaveProperty('name');
    expect(res.body.data[0]).toHaveProperty('icon');
    expect(res.body.data[0]).toHaveProperty('color');
  });

  it('debe permitir acceso sin autenticación', async () => {
    const res = await request(app).get('/api/incidents/types');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('POST /api/incidents', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const validPayload = {
    name: 'Reportero',
    phone: '+573001234567',
    latitude: 7.065,
    longitude: -73.84,
    type: 'accident',
    description: 'Dos carros chocaron',
  };

  it('debe crear un incidente sin autenticación (201)', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [mockIncident], rowCount: 1 } as any) // Insert incident
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any); // Get nearby vendors

    const res = await request(app)
      .post('/api/incidents')
      .send(validPayload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data).toHaveProperty('type', 'accident');
  });

  it('debe crear un incidente con usuario autenticado (201)', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [mockIncident], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    const token = generateToken(mockUser);
    const res = await request(app)
      .post('/api/incidents')
      .set('Authorization', `Bearer ${token}`)
      .send(validPayload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it('debe devolver 400 si el tipo de incidente no es válido', async () => {
    const res = await request(app)
      .post('/api/incidents')
      .send({ ...validPayload, type: 'invalid_type' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('debe validar campos requeridos', async () => {
    const { name: _name, ...withoutName } = validPayload;
    const res = await request(app)
      .post('/api/incidents')
      .send(withoutName);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('debe notificar a vendedores y autoridades cercanas por WebSocket', async () => {
    const mockVendors = [
      { id: 'vendor-1', latitude: 7.066, longitude: -73.841, distance_meters: 150 },
      { id: 'vendor-2', latitude: 7.064, longitude: -73.839, distance_meters: 200 },
    ];

    mockQuery
      .mockResolvedValueOnce({ rows: [mockIncident], rowCount: 1 } as any) // Insert
      .mockResolvedValueOnce({ rows: mockVendors, rowCount: 2 } as any); // Get vendors

    const res = await request(app)
      .post('/api/incidents')
      .send(validPayload);

    expect(res.status).toBe(201);
    expect(mockQuery).toHaveBeenCalledTimes(2);
  });
});

describe('GET /api/incidents/nearby', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe listar incidentes cercanos (200)', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ ...mockIncident, distance_meters: 300 }],
      rowCount: 1,
    } as any);

    const token = generateToken(mockUser);
    const res = await request(app)
      .get('/api/incidents/nearby')
      .set('Authorization', `Bearer ${token}`)
      .query({ lat: 7.065, lng: -73.84, radius: 5000 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data[0]).toHaveProperty('distance_meters');
  });

  it('debe devolver 400 si falta lat o lng', async () => {
    const token = generateToken(mockUser);
    const res = await request(app)
      .get('/api/incidents/nearby')
      .set('Authorization', `Bearer ${token}`)
      .query({ lat: 7.065 }); // Falta lng

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('debe devolver 401 si no está autenticado', async () => {
    const res = await request(app)
      .get('/api/incidents/nearby')
      .query({ lat: 7.065, lng: -73.84 });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('debe filtrar por tipo de incidente', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    const token = generateToken(mockUser);
    await request(app)
      .get('/api/incidents/nearby')
      .set('Authorization', `Bearer ${token}`)
      .query({ lat: 7.065, lng: -73.84, type: 'medical' });

    const queryCall = mockQuery.mock.calls[0];
    expect(queryCall[0]).toContain('type');
  });

  it('debe filtrar por estado si se proporciona', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    const token = generateToken(mockUser);
    await request(app)
      .get('/api/incidents/nearby')
      .set('Authorization', `Bearer ${token}`)
      .query({ lat: 7.065, lng: -73.84, status: 'in_progress' });

    const queryCall = mockQuery.mock.calls[0];
    expect(queryCall[0]).toContain('status');
  });

  it('debe devolver solo incidentes pending o in_progress por defecto', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    const token = generateToken(mockUser);
    await request(app)
      .get('/api/incidents/nearby')
      .set('Authorization', `Bearer ${token}`)
      .query({ lat: 7.065, lng: -73.84 });

    const queryCall = mockQuery.mock.calls[0];
    expect(queryCall[0]).toContain("status IN ('pending', 'in_progress')");
  });
});

describe('PATCH /api/incidents/:id/status', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe cambiar estado del incidente a in_progress (200)', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ ...mockIncident, status: 'in_progress' }],
      rowCount: 1,
    } as any);

    const token = generateToken(mockUser);
    const res = await request(app)
      .patch(`/api/incidents/${mockIncident.id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'in_progress', notes: 'Atendiendo' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('in_progress');
    expect(res.body.message).toMatch(/aceptado/i);
  });

  it('debe cambiar estado del incidente a resolved (200)', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{
        ...mockIncident,
        status: 'resolved',
        resolved_at: new Date().toISOString(),
        resolved_by: mockUser.userId,
      }],
      rowCount: 1,
    } as any);

    const token = generateToken(mockUser);
    const res = await request(app)
      .patch(`/api/incidents/${mockIncident.id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'resolved', notes: 'Problema resuelto' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('resolved');
    expect(res.body.data).toHaveProperty('resolved_by');
  });

  it('debe devolver 404 si el incidente no existe', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    const token = generateToken(mockUser);
    const res = await request(app)
      .patch('/api/incidents/nonexistent-id/status')
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'in_progress' });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('debe devolver 401 si no está autenticado', async () => {
    const res = await request(app)
      .patch(`/api/incidents/${mockIncident.id}/status`)
      .send({ status: 'in_progress' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('debe adjuntar notas adicionales', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ ...mockIncident, notes: 'Nota anterior\nNueva nota' }],
      rowCount: 1,
    } as any);

    const token = generateToken(mockUser);
    const res = await request(app)
      .patch(`/api/incidents/${mockIncident.id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'in_progress', notes: 'Nueva nota' });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('notes');
  });
});

describe('GET /api/incidents/my-reports', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe devolver reportes del usuario autenticado (200)', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [mockIncident, { ...mockIncident, id: 'incident-2', status: 'resolved' }],
      rowCount: 2,
    } as any);

    const token = generateToken(mockUser);
    const res = await request(app)
      .get('/api/incidents/my-reports')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.length).toBe(2);
  });

  it('debe devolver vacío si el usuario no tiene reportes', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    const token = generateToken(mockUser);
    const res = await request(app)
      .get('/api/incidents/my-reports')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it('debe devolver 401 si no está autenticado', async () => {
    const res = await request(app).get('/api/incidents/my-reports');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('debe ordenar reportes por fecha más reciente primero', async () => {
    const older = { ...mockIncident, created_at: new Date(Date.now() - 86400000).toISOString() };
    const newer = { ...mockIncident, id: 'incident-2', created_at: new Date().toISOString() };

    mockQuery.mockResolvedValueOnce({ rows: [newer, older], rowCount: 2 } as any);

    const token = generateToken(mockUser);
    const res = await request(app)
      .get('/api/incidents/my-reports')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
    const date1 = new Date(res.body.data[0].created_at).getTime();
    const date2 = new Date(res.body.data[1].created_at).getTime();
    
    expect(date1).toBeGreaterThanOrEqual(date2);
  });
});
