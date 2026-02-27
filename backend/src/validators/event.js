import { z } from 'zod';

export const createEventSchema = z.object({
  title: z.string().min(1, 'Title required').max(200),
  description: z.string().max(5000).optional(),
  date: z.coerce.date().optional(),
  durationMinutes: z.number().min(0).optional(),
  genre: z.array(z.string().max(100)).max(20).optional(),
  budget: z.number().min(0).optional(),
  expectations: z.string().max(2000).optional(),
}).strict();

export const updateEventSchema = createEventSchema.partial();

export const eventQuerySchema = z.object({
  genre: z.string().optional(),
  location: z.string().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(12),
});
