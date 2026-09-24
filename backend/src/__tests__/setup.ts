// Mock global de la base de datos para evitar conexiones reales en tests unitarios
jest.mock('../config/database', () => ({
  query: jest.fn(),
  pool: {
    connect: jest.fn(),
    query: jest.fn(),
    end: jest.fn(),
  }
}));

// Silenciar logs durante los tests para tener una salida limpia
jest.spyOn(console, 'log').mockImplementation(() => {});
jest.spyOn(console, 'error').mockImplementation(() => {});

