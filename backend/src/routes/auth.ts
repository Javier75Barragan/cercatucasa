import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../config/database';
import { generateToken, authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { User, ApiResponse } from '../types';

const router = Router();

// Registro de usuario
router.post(
  '/register',
  asyncHandler(async (req, res) => {
    try {
      const { email, password, name, phone, role = 'customer' } = req.body;

      console.log('📥 Datos recibidos:', { email, name, phone, role });

      // Validaciones básicas
      if (!email || !password || !name || !phone) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Faltan campos requeridos',
        };
        res.status(400).json(response);
        return;
      }

      // Validar email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Email inválido',
        };
        res.status(400).json(response);
        return;
      }

      // Validar contraseña
      if (password.length < 6) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'La contraseña debe tener al menos 6 caracteres',
        };
        res.status(400).json(response);
        return;
      }

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
      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      const response: ApiResponse<{ user: typeof user; token: string }> = {
        success: true,
        data: { user, token },
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
        error: error.message || 'Error interno del servidor',
      });
    }
  })
);

// Login
router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Email y contraseña son requeridos',
      };
      res.status(400).json(response);
      return;
    }

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

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Eliminar password del objeto de respuesta
    const { password: _, ...userWithoutPassword } = user;

    const response: ApiResponse<{ user: typeof userWithoutPassword; token: string }> = {
      success: true,
      data: { user: userWithoutPassword, token },
      message: 'Login exitoso',
    };

    res.json(response);
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
