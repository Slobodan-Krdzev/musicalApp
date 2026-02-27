import { z } from 'zod';

export const createAdvertSchema = z.object({
  title: z.string().min(1, 'Title required').max(200),
  date: z.coerce.date().optional(),
  area: z.string().max(200).optional(),
  durationMinutes: z.number().min(0).optional(),
  genre: z.array(z.string().max(100)).max(20).optional(),
  description: z.string().max(5000).optional(),
  photos: z.array(z.string()).max(10).optional(),
  videos: z.array(z.object({ url: z.string().url(), platform: z.string() })).max(5).optional(),
}).strict();

export const updateAdvertSchema = createAdvertSchema.partial();
