import { z } from 'zod';

export const createVendorSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(255),
    description: z.string().max(1000).optional(),
    type: z.string().min(1, 'El tipo es requerido').max(50),
    category: z.string().min(1, 'La categoría es requerida').max(100),
    subcategories: z.array(z.string()).optional(),
    phone: z.string().min(5, 'El teléfono debe tener al menos 5 caracteres').max(20),
    whatsapp: z.string().max(20).optional(),
    email: z.string().email('Email inválido').optional().or(z.literal('')),
    website: z.string().url('URL inválida').optional().or(z.literal('')),
    address: z.string().max(500).optional(),
    schedule: z.any().optional(), // Puede ser validado más estrictamente dependiendo de la estructura
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    accuracy: z.number().min(0).optional()
  })
});

export const updateVendorSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(255).optional(),
    description: z.string().max(1000).optional(),
    category: z.string().min(1).max(100).optional(),
    subcategories: z.array(z.string()).optional(),
    phone: z.string().min(5).max(20).optional(),
    whatsapp: z.string().max(20).optional(),
    email: z.string().email().optional().or(z.literal('')),
    website: z.string().url().optional().or(z.literal('')),
    address: z.string().max(500).optional(),
    schedule: z.any().optional(),
    photos: z.array(z.string()).optional(),
    avatar_url: z.string().url().optional()
  })
});

export const updateLocationSchema = z.object({
  body: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    accuracy: z.number().min(0).optional()
  })
});

export const toggleLocationSchema = z.object({
  body: z.object({
    is_active: z.boolean()
  })
});

export const reviewSchema = z.object({
  body: z.object({
    rating: z.number().min(1).max(5),
    comment: z.string().max(1000).optional()
  })
});
