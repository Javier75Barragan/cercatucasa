import request from 'supertest';
import express from 'express';
import cors from 'cors';
import { json } from 'express';

/**
 * Tests de integración para las rutas de autenticación.
 * 
 * NOTA: Estos tests usan mocks de la base de datos para no requerir
 * una conexión real a PostgreSQL en CI/CD.
 * 
 * Para ejecutarlos: npm run test
 */

// ─── Mocks ────────────────────────────────────────────────────────────────────

// Mock del módulo de base de datos
jest.mock('../config/database', () => ({
  query: jest.fn(),
}));

// Mock de bcrypt para acelerar los tests (evitar el costo computacional real)
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('$2b$10$hashedpassword'),
  compare: jest.fn(),
}));

import { query } from '../config/database';
import bcrypt from 'bcrypt';

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockBcryptCompare = bcrypt.compare as jest.MockedFunction<typeof bcrypt.compare>;

// ─── Setup de la app de test ──────────────────────────────────────────────────

// Configurar variables de entorno para los tests
process.env.JWT_SECRET = 'test-secret-key-for-testing-purposes-only-32chars';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-testing-32chars!!';
process.env.JWT_EXPIRES_IN = '15m';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';

// Importar las rutas después de configurar las variables
import authRoutes from '../routes/auth';
import { errorHandler } from '../middleware/errorHandler';

// Configurar rate limiter para que no afecte tests (ventana muy alta)
process.env.NODE_ENV = 'test';

const app = express();
app.use(json());
app.use(cors());
// En test se usa la app directamente; el rate limiter usa IP
// Para evitar 429, configuramos el trust proxy para que cada test tenga IP única
app.set('trust proxy', 1);
app.use('/api/auth', authRoutes);
app.use(errorHandler);

// ─── Datos de prueba ──────────────────────────────────────────────────────────

const mockUser = {
  id: 'user-uuid-123',
  email: 'test@example.com',
  name: 'Test User',
  phone: '+573001234567',
  role: 'customer',
  is_active: true,
  avatar_url: null,
  created_at: new Date().toISOString(),
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('POST /api/auth/register', () => {
  const validPayload = {
    email: 'nuevo@example.com',
    password: 'SecurePass123!',
    name: 'Nuevo Usuario',
    phone: '+573009876543',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe registrar un usuario nuevo exitosamente (201)', async () => {
    // Simular que no existe usuario previo con ese email y la inserción es exitosa
    mockQuery
      .mockResolvedValueOnce({ rows: [{ ...mockUser, email: validPayload.email }], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any); // insert refresh token

    const res = await request(app).post('/api/auth/register').send(validPayload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data).toHaveProperty('refreshToken');
    expect(res.body.data.user).not.toHaveProperty('password');
  });

  it('debe devolver 409 si el email ya está registrado', async () => {
    mockQuery.mockRejectedValueOnce({ code: '23505' });

    const res = await request(app).post('/api/auth/register').send(validPayload);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/email ya está registrado/i);
  });

  it('debe devolver 400 si falta el campo email', async () => {
    const { email: _email, ...withoutEmail } = validPayload;
    const res = await request(app).post('/api/auth/register').send(withoutEmail);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('debe devolver 400 si la contraseña es muy corta', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...validPayload, password: '123' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('debe devolver 400 si el email no tiene formato válido', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...validPayload, email: 'no-es-un-email' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe autenticar correctamente con credenciales válidas (200)', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ ...mockUser, password: '$2b$10$hashedpassword' }], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any); // insert refresh token
    (mockBcryptCompare as jest.Mock).mockResolvedValueOnce(true);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: mockUser.email, password: 'CorrectPassword123!' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data).toHaveProperty('refreshToken');
    expect(res.body.data.user).not.toHaveProperty('password');
    expect(res.body.message).toMatch(/login exitoso/i);
  });

  it('debe devolver 401 si el usuario no existe', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'noexiste@example.com', password: 'AnyPassword123!' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/credenciales inválidas/i);
  });

  it('debe devolver 401 si la contraseña es incorrecta', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ ...mockUser, password: '$2b$10$hashedpassword' }], rowCount: 1 } as any);
    (mockBcryptCompare as jest.Mock).mockResolvedValueOnce(false);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: mockUser.email, password: 'WrongPassword!' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/credenciales inválidas/i);
  });

  it('debe devolver 401 si el usuario está desactivado', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ ...mockUser, is_active: false, password: '$2b$10$hashedpassword' }], rowCount: 1 } as any);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: mockUser.email, password: 'AnyPassword123!' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/usuario desactivado/i);
  });

  it('debe devolver 400 si falta el campo password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: mockUser.email });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe('POST /api/auth/refresh', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe devolver 400 si no se envía refreshToken', async () => {
    const res = await request(app).post('/api/auth/refresh').send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('debe devolver 401 si el refreshToken no existe en BD', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: 'token-invalido-que-no-existe' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/refresh token inválido/i);
  });

  it('no debe exponer el password en ninguna respuesta de auth', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ ...mockUser, password: '$2b$10$hashedpassword' }], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
    (mockBcryptCompare as jest.Mock).mockResolvedValueOnce(true);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: mockUser.email, password: 'CorrectPassword123!' });

    expect(res.status).toBe(200);
    expect(JSON.stringify(res.body)).not.toContain('$2b$10$');
    expect(res.body.data?.user?.password).toBeUndefined();
  });
});

describe('GET /api/auth/me', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe devolver datos del usuario autenticado (200)', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [mockUser], rowCount: 1 } as any);

    const token = 'valid.jwt.token';
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id', mockUser.id);
    expect(res.body.data).toHaveProperty('email', mockUser.email);
    expect(res.body.data).not.toHaveProperty('password');
  });

  it('debe devolver 401 si no hay token', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('debe devolver 404 si el usuario no existe', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    const token = 'valid.jwt.token';
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

describe('PUT /api/auth/me', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe actualizar perfil del usuario (200)', async () => {
    const updateData = { name: 'Nombre Actualizado', phone: '+573109876543' };
    mockQuery.mockResolvedValueOnce({ rows: [{ ...mockUser, ...updateData }], rowCount: 1 } as any);

    const token = 'valid.jwt.token';
    const res = await request(app)
      .put('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .send(updateData);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('name', updateData.name);
    expect(res.body.data).toHaveProperty('phone', updateData.phone);
  });

  it('debe devolver 401 si no hay token', async () => {
    const res = await request(app)
      .put('/api/auth/me')
      .send({ name: 'Nombre Actualizado' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('debe permitir actualización parcial (solo nombre)', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ ...mockUser, name: 'Solo Nombre' }], rowCount: 1 } as any);

    const token = 'valid.jwt.token';
    const res = await request(app)
      .put('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Solo Nombre' });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('name', 'Solo Nombre');
  });
});

describe('PUT /api/auth/password', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe cambiar contraseña exitosamente (200)', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ password: '$2b$10$hashedpassword' }], rowCount: 1 } as any);
    (mockBcryptCompare as jest.Mock).mockResolvedValueOnce(true);
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    const token = 'valid.jwt.token';
    const res = await request(app)
      .put('/api/auth/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'OldPass123!', newPassword: 'NewPass123!' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/contraseña actualizada/i);
  });

  it('debe devolver 401 si no hay token', async () => {
    const res = await request(app)
      .put('/api/auth/password')
      .send({ currentPassword: 'OldPass123!', newPassword: 'NewPass123!' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('debe devolver 400 si contraseña actual es incorrecta', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ password: '$2b$10$hashedpassword' }], rowCount: 1 } as any);
    (mockBcryptCompare as jest.Mock).mockResolvedValueOnce(false);

    const token = 'valid.jwt.token';
    const res = await request(app)
      .put('/api/auth/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'WrongPass!', newPassword: 'NewPass123!' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/contraseña actual incorrecta/i);
  });

  it('debe devolver 400 si contraseña nueva es muy corta', async () => {
    const token = 'valid.jwt.token';
    const res = await request(app)
      .put('/api/auth/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'OldPass123!', newPassword: '123' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
