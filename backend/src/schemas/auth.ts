import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(255),
    phone: z.string().min(8, 'Teléfono inválido').max(20),
    role: z.enum(['customer', 'seller', 'admin']).optional().default('customer'),
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(1, 'La contraseña es requerida'),
  })
});

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(255).optional(),
    phone: z.string().min(8, 'Teléfono inválido').max(20).optional(),
    avatar_url: z.string().url('URL inválida').optional(),
  })
});

export const updatePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Contraseña actual requerida'),
    newPassword: z.string().min(6, 'La nueva contraseña debe tener al menos 6 caracteres'),
  })
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token es requerido'),
  })
});
