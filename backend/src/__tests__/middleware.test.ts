import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Configurar variables de entorno antes de importar los middlewares
process.env.JWT_SECRET = 'test-secret-key-for-testing-purposes-only-32chars';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-testing-32chars!!';
process.env.NODE_ENV = 'test';

import {
  generateToken,
  generateRefreshToken,
  verifyToken,
  verifyRefreshToken,
  authenticate,
  authorize,
  optionalAuth
} from '../middleware/auth';
import { errorHandler, notFoundHandler, asyncHandler, CustomError } from '../middleware/errorHandler';
import { UserRole } from '../types';

// Mock de consola para no inundar el output de las pruebas
let consoleErrorSpy: jest.SpyInstance;
beforeAll(() => {
  consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  consoleErrorSpy.mockRestore();
});

describe('Middleware de Autenticación y Tokens (auth.ts)', () => {
  const payload = {
    userId: 'user-123',
    email: 'user@example.com',
    role: 'seller' as UserRole,
  };

  describe('Funciones de Generación y Verificación de Tokens', () => {
    it('debe generar y verificar un token de acceso válido', () => {
      const token = generateToken(payload);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      const verified = verifyToken(token);
      expect(verified.userId).toBe(payload.userId);
      expect(verified.email).toBe(payload.email);
      expect(verified.role).toBe(payload.role);
    });

    it('debe generar y verificar un token de refresco válido', () => {
      const token = generateRefreshToken(payload);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      const verified = verifyRefreshToken(token);
      expect(verified.userId).toBe(payload.userId);
      expect(verified.email).toBe(payload.email);
      expect(verified.role).toBe(payload.role);
    });

    it('debe lanzar un error al verificar un token inválido', () => {
      expect(() => verifyToken('invalid-token')).toThrow();
    });
  });

  describe('Middleware authenticate', () => {
    let app: express.Express;

    beforeEach(() => {
      app = express();
      app.use(express.json());
      app.get('/protected', authenticate, (req: Request, res: Response) => {
        res.status(200).json({ success: true, user: req.user });
      });
    });

    it('debe permitir el paso si se proporciona un token válido en Authorization Header', async () => {
      const token = generateToken(payload);
      const res = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.userId).toBe(payload.userId);
    });

    it('debe retornar 401 si no se provee el header de Authorization', async () => {
      const res = await request(app).get('/protected');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('No se proporcionó token de autenticación');
    });

    it('debe retornar 401 si el header no empieza con Bearer ', async () => {
      const token = generateToken(payload);
      const res = await request(app)
        .get('/protected')
        .set('Authorization', `Token ${token}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('No se proporcionó token de autenticación');
    });

    it('debe retornar 401 si el token es inválido', async () => {
      const res = await request(app)
        .get('/protected')
        .set('Authorization', 'Bearer token-invalido-y-muy-malo');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Token inválido o expirado');
    });
  });

  describe('Middleware authorize', () => {
    let app: express.Express;

    beforeEach(() => {
      app = express();
      app.use(express.json());

      // Endpoint accesible solo por admin o authority
      app.get(
        '/admin-only',
        (req: Request, _res: Response, next: NextFunction) => {
          // Simulamos el usuario en la request
          next();
        },
        authorize('admin', 'authority'),
        (_req: Request, res: Response) => {
          res.status(200).json({ success: true, message: 'Welcome' });
        }
      );
    });

    it('debe permitir acceso si el rol del usuario está autorizado', async () => {
      const adminApp = express();
      adminApp.use(express.json());
      adminApp.get(
        '/admin-only',
        (req: Request, _res: Response, next: NextFunction) => {
          req.user = {
            userId: 'admin-1',
            email: 'admin@test.com',
            role: 'admin',
            iat: 0,
            exp: 0,
          };
          next();
        },
        authorize('admin', 'authority'),
        (_req: Request, res: Response) => {
          res.status(200).json({ success: true });
        }
      );

      const res = await request(adminApp).get('/admin-only');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('debe retornar 401 si el usuario no está autenticado (req.user es undefined)', async () => {
      const res = await request(app).get('/admin-only');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('No autenticado');
    });

    it('debe retornar 403 si el rol del usuario no coincide con los autorizados', async () => {
      const unauthorizedApp = express();
      unauthorizedApp.use(express.json());
      unauthorizedApp.get(
        '/admin-only',
        (req: Request, _res: Response, next: NextFunction) => {
          req.user = {
            userId: 'cust-1',
            email: 'customer@test.com',
            role: 'customer',
            iat: 0,
            exp: 0,
          };
          next();
        },
        authorize('admin', 'authority'),
        (_req: Request, res: Response) => {
          res.status(200).json({ success: true });
        }
      );

      const res = await request(unauthorizedApp).get('/admin-only');
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('No tienes permisos para acceder a este recurso');
    });
  });

  describe('Middleware optionalAuth', () => {
    let app: express.Express;

    beforeEach(() => {
      app = express();
      app.use(express.json());
      app.get('/optional', optionalAuth, (req: Request, res: Response) => {
        res.status(200).json({ success: true, user: req.user });
      });
    });

    it('debe establecer req.user si se provee un token válido', async () => {
      const token = generateToken(payload);
      const res = await request(app)
        .get('/optional')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.userId).toBe(payload.userId);
    });

    it('debe dejar req.user como undefined si no se provee token', async () => {
      const res = await request(app).get('/optional');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user).toBeUndefined();
    });

    it('debe ignorar errores de token inválido y dejar req.user como undefined', async () => {
      const res = await request(app)
        .get('/optional')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user).toBeUndefined();
    });
  });
});

describe('Middleware de Manejo de Errores (errorHandler.ts)', () => {
  let app: express.Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  it('debe manejar CustomError con código de estado y mensaje personalizado', async () => {
    app.get('/error-custom', (_req: Request, _res: Response, next: NextFunction) => {
      const err: CustomError = new Error('Acceso restringido temporalmente');
      err.statusCode = 403;
      next(err);
    });
    app.use(errorHandler);

    const res = await request(app).get('/error-custom');
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Acceso restringido temporalmente');
  });

  it('debe manejar el código de error Postgres 23505 (recurso ya existe) con 409', async () => {
    app.get('/error-db-duplicate', (_req: Request, _res: Response, next: NextFunction) => {
      const err: CustomError = new Error('duplicate key value violates unique constraint');
      err.code = '23505';
      next(err);
    });
    app.use(errorHandler);

    const res = await request(app).get('/error-db-duplicate');
    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('El recurso ya existe');
  });

  it('debe manejar códigos de error Postgres que inicien con 22 (datos inválidos) con 400', async () => {
    app.get('/error-db-data', (_req: Request, _res: Response, next: NextFunction) => {
      const err: CustomError = new Error('invalid input syntax for type integer');
      err.code = '22P02';
      next(err);
    });
    app.use(errorHandler);

    const res = await request(app).get('/error-db-data');
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Datos inválidos');
  });

  it('debe manejar códigos de error Postgres que inicien con 23 (violación de restricción) con 400', async () => {
    app.get('/error-db-constraint', (_req: Request, _res: Response, next: NextFunction) => {
      const err: CustomError = new Error('violates foreign key constraint');
      err.code = '23503';
      next(err);
    });
    app.use(errorHandler);

    const res = await request(app).get('/error-db-constraint');
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Violación de restricción');
  });

  it('debe retornar 500 y un error genérico por defecto', async () => {
    app.get('/error-generic', (_req: Request, _res: Response, next: NextFunction) => {
      next(new Error('Alguna falla catastrófica inesperada'));
    });
    app.use(errorHandler);

    const res = await request(app).get('/error-generic');
    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Alguna falla catastrófica inesperada');
  });

  it('debe incluir stack trace si NODE_ENV es development', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const devApp = express();
    devApp.get('/error-stack', (_req: Request, _res: Response, next: NextFunction) => {
      next(new Error('Falla de desarrollo'));
    });
    devApp.use(errorHandler);

    const res = await request(devApp).get('/error-stack');
    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body).toHaveProperty('stack');

    process.env.NODE_ENV = originalEnv;
  });

  it('no debe incluir stack trace si NODE_ENV es production', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const prodApp = express();
    prodApp.get('/error-no-stack', (_req: Request, _res: Response, next: NextFunction) => {
      next(new Error('Falla de producción'));
    });
    prodApp.use(errorHandler);

    const res = await request(prodApp).get('/error-no-stack');
    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.stack).toBeUndefined();

    process.env.NODE_ENV = originalEnv;
  });
});

describe('Middleware notFoundHandler', () => {
  let app: express.Express;

  beforeEach(() => {
    app = express();
    app.use(notFoundHandler);
  });

  it('debe retornar 404 y un mensaje de ruta no encontrada', async () => {
    const res = await request(app).get('/ruta-inexistente');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Ruta no encontrada');
  });
});

describe('Utilidad asyncHandler', () => {
  let app: express.Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  it('debe pasar automáticamente cualquier error asíncrono capturado al next()', async () => {
    app.get(
      '/async-route',
      asyncHandler(async (_req: Request, _res: Response, _next: NextFunction) => {
        throw new Error('Error asíncrono');
      })
    );
    app.use(errorHandler);

    const res = await request(app).get('/async-route');
    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Error asíncrono');
  });

  it('debe permitir ejecutar código asíncrono con éxito si no hay errores', async () => {
    app.get(
      '/async-success',
      asyncHandler(async (_req: Request, res: Response, _next: NextFunction) => {
        res.status(200).json({ success: true });
      })
    );

    const res = await request(app).get('/async-success');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
