import { vi } from 'vitest';

// Mock global de la base de datos para evitar conexiones reales en tests unitarios
vi.mock('../config/database', () => ({
  query: vi.fn(),
  pool: {
    connect: vi.fn(),
    query: vi.fn(),
    end: vi.fn(),
  }
}));

// Silenciar logs durante los tests para tener una salida limpia
vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'error').mockImplementation(() => {});
