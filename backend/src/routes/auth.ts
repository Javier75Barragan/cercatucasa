import { Router } from 'express';
import bcrypt from 'bcrypt';
import rateLimit from 'express-rate-limit';
import { query } from '../config/database';
import { generateToken, generateRefreshToken, authenticate, verifyToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { validate } from '../middleware/validate';
import { registerSchema, loginSchema, updateProfileSchema, updatePasswordSchema, refreshTokenSchema } from '../schemas/auth';
import { User, ApiResponse } from '../types';

const router = Router();

// Configuración de rate limiting para autenticación
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // 10 intentos por ventana (un poco más permisivo para desarrollo)
  message: { 
    success: false, 
    error: 'Demasiados intentos desde esta IP, por favor intente después de 15 minutos' 
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Registro de usuario
router.post(
  '/register',
  authLimiter,
  validate(registerSchema),
  asyncHandler(async (req, res) => {
    try {
      const { email, password, name, phone, role = 'customer' } = req.body;

      // Hash de contraseña
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insertar usuario
      const result = await query<User>(
        `INSERT INTO users (email, password, name, phone, role)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, email, name, phone, role, is_active, created_at`,
        [email, hashedPassword, name, phone, role]
      );

      const user = result.rows[0];
      const payload = {
        userId: user.id,
        email: user.email,
        role: user.role,
      };
      
      const token = generateToken(payload);
      const refreshToken = generateRefreshToken(payload);

      // Guardar refresh token en BD
      await query(
        `INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, CURRENT_TIMESTAMP + INTERVAL '7 days')`,
        [user.id, refreshToken]
      );

      const response: ApiResponse<{ user: typeof user; token: string; refreshToken: string }> = {
        success: true,
        data: { user, token, refreshToken },
        message: 'Usuario registrado exitosamente',
      };

      res.status(201).json(response);
    } catch (error: any) {
      console.error('❌ Error en registro:', error);

      // Error de email duplicado
      if (error.code === '23505') {
        res.status(409).json({
          success: false,
          error: 'Este email ya está registrado',
        });
        return;
      }

      // Error de tabla no existe
      if (error.code === '42P01') {
        res.status(500).json({
          success: false,
          error: 'Error de base de datos: tabla no inicializada',
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
      });
    }
  })
);

// Login
router.post(
  '/login',
  authLimiter,
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Buscar usuario
    const result = await query<User>(
      `SELECT id, email, password, name, phone, role, is_active, created_at
       FROM users WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Credenciales inválidas',
      };
      res.status(401).json(response);
      return;
    }

    const user = result.rows[0];

    if (!user.is_active) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Usuario desactivado',
      };
      res.status(401).json(response);
      return;
    }

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Credenciales inválidas',
      };
      res.status(401).json(response);
      return;
    }

    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };
    
    const token = generateToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Guardar refresh token
    await query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, CURRENT_TIMESTAMP + INTERVAL '7 days')`,
      [user.id, refreshToken]
    );

    // Eliminar password del objeto de respuesta
    const { password: _, ...userWithoutPassword } = user;

    const response: ApiResponse<{ user: typeof userWithoutPassword; token: string; refreshToken: string }> = {
      success: true,
      data: { user: userWithoutPassword, token, refreshToken },
      message: 'Login exitoso',
    };

    res.json(response);
  })
);

// Refresh Token
router.post(
  '/refresh',
  authLimiter,
  validate(refreshTokenSchema),
  asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    // Verificar si el token existe en BD y no ha expirado
    const result = await query(
      `SELECT user_id FROM refresh_tokens WHERE token = $1 AND expires_at > CURRENT_TIMESTAMP`,
      [refreshToken]
    );

    if (result.rows.length === 0) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Refresh token inválido o expirado',
      };
      res.status(401).json(response);
      return;
    }

    try {
      const decoded = verifyToken(refreshToken);
      const payload = {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      };
      
      const newToken = generateToken(payload);
      const newRefreshToken = generateRefreshToken(payload);

      // Rotar el token en BD
      await query(
        `UPDATE refresh_tokens SET token = $1, expires_at = CURRENT_TIMESTAMP + INTERVAL '7 days' WHERE token = $2`,
        [newRefreshToken, refreshToken]
      );

      res.json({
        success: true,
        data: { token: newToken, refreshToken: newRefreshToken }
      });
    } catch (error) {
      await query(`DELETE FROM refresh_tokens WHERE token = $1`, [refreshToken]);
      const response: ApiResponse<null> = {
        success: false,
        error: 'Refresh token inválido',
      };
      res.status(401).json(response);
    }
  })
);

// Perfil del usuario autenticado
router.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    const result = await query<User>(
      `SELECT id, email, name, phone, role, avatar_url, is_active, created_at
       FROM users WHERE id = $1`,
      [req.user!.userId]
    );

    if (result.rows.length === 0) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Usuario no encontrado',
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse<User> = {
      success: true,
      data: result.rows[0],
    };

    res.json(response);
  })
);

// Actualizar perfil
router.put(
  '/me',
  authenticate,
  validate(updateProfileSchema),
  asyncHandler(async (req, res) => {
    const { name, phone, avatar_url } = req.body;

    const result = await query<User>(
      `UPDATE users
       SET name = COALESCE($1, name),
           phone = COALESCE($2, phone),
           avatar_url = COALESCE($3, avatar_url),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING id, email, name, phone, role, avatar_url, is_active, created_at`,
      [name, phone, avatar_url, req.user!.userId]
    );

    const response: ApiResponse<User> = {
      success: true,
      data: result.rows[0],
      message: 'Perfil actualizado exitosamente',
    };

    res.json(response);
  })
);

// Cambiar contraseña
router.put(
  '/password',
  authenticate,
  validate(updatePasswordSchema),
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    // Obtener usuario actual con contraseña
    const userResult = await query<User>(
      `SELECT password FROM users WHERE id = $1`,
      [req.user!.userId]
    );

    const isValidPassword = await bcrypt.compare(
      currentPassword,
      userResult.rows[0].password
    );

    if (!isValidPassword) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Contraseña actual incorrecta',
      };
      res.status(400).json(response);
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await query(
      `UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [hashedPassword, req.user!.userId]
    );

    const response: ApiResponse<null> = {
      success: true,
      message: 'Contraseña actualizada exitosamente',
    };

    res.json(response);
  })
);


export default router;
