import { z } from 'zod';

export const createProductSchema = z.object({
  body: z.object({
    vendor_id: z.string().uuid('ID de vendor inválido'),
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(255),
    description: z.string().max(1000).optional(),
    price: z.number().min(0).optional(),
    currency: z.string().length(3).optional(),
    photos: z.array(z.string().url()).optional(),
    category: z.string().min(1, 'La categoría es requerida').max(100)
  })
});

export const updateProductSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(255).optional(),
    description: z.string().max(1000).optional(),
    price: z.number().min(0).optional(),
    currency: z.string().length(3).optional(),
    photos: z.array(z.string().url()).optional(),
    category: z.string().min(1).max(100).optional(),
    is_available: z.boolean().optional()
  })
});
