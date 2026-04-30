import { z } from 'zod';

export const createNotificationAlertSchema = z.object({
  body: z.object({
    category: z.string().min(1, 'La categoría es requerida').max(100),
    subcategories: z.array(z.string()).optional(),
    vendor_types: z.array(z.string()).optional(),
    radius_meters: z.number().min(10).max(50000).optional(),
    schedule_start: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
    schedule_end: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
    days_of_week: z.array(z.number().min(0).max(6)).optional(),
  })
});

export const updateNotificationAlertSchema = z.object({
  body: z.object({
    category: z.string().min(1).max(100).optional(),
    subcategories: z.array(z.string()).optional(),
    vendor_types: z.array(z.string()).optional(),
    radius_meters: z.number().min(10).max(50000).optional(),
    schedule_start: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional().or(z.literal(null)),
    schedule_end: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional().or(z.literal(null)),
    days_of_week: z.array(z.number().min(0).max(6)).optional(),
    is_active: z.boolean().optional()
  })
});

export const checkNotificationsSchema = z.object({
  body: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  })
});
