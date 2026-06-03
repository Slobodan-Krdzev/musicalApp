import { z } from 'zod';

const objectId = z.string().refine((id) => /^[a-f\d]{24}$/i.test(id), 'Invalid ID');

export const applyToEventSchema = z.object({
  eventId: objectId,
  quote: z.number().min(0).optional(),
  message: z.string().max(2000).optional(),
}).strict();

export const applyToOfferingSchema = z.object({
  offeringId: objectId,
  quote: z.number().min(0).optional(),
  message: z.string().max(2000).optional(),
}).strict();

export const updateApplicationStatusSchema = z.object({
  status: z.enum(['ACCEPTED', 'REJECTED']),
}).strict();

export const updateApplicationQuoteSchema = z.object({
  quote: z.number().min(0),
  message: z.string().max(500).optional(),
}).strict();
