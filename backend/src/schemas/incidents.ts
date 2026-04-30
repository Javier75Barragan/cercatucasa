import { z } from 'zod';

export const createIncidentSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'El nombre es requerido').max(255),
    phone: z.string().min(5, 'El teléfono es requerido').max(20),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    type: z.string().min(1, 'El tipo de incidente es requerido'),
    description: z.string().max(1000).optional()
  })
});

export const updateIncidentStatusSchema = z.object({
  body: z.object({
    status: z.enum(['pending', 'in_progress', 'resolved', 'cancelled']),
    notes: z.string().max(1000).optional()
  })
});
