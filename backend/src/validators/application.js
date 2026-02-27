import { z } from 'zod';

export const createApplicationSchema = z.object({
  eventId: z.string().refine((id) => /^[a-f\d]{24}$/i.test(id), 'Invalid event ID'),
  message: z.string().max(2000).optional(),
}).strict();

export const updateApplicationStatusSchema = z.object({
  status: z.enum(['ACCEPTED', 'REJECTED']),
}).strict();
