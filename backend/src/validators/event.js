import { z } from 'zod';

export const createEventSchema = z.object({
  title: z.string().min(1, 'Title required').max(200),
  description: z.string().min(1, 'Description required').max(5000),
  date: z.coerce.date({ required_error: 'Date is required' }),
  activeTo: z.coerce.date({ required_error: 'Active To date is required' }),
  lookingFor: z.array(z.string().max(100)).max(30).optional(),
  approximatePayment: z.number().min(0).optional(),
  paymentType: z.string().max(100).optional(),
});

export const updateEventSchema = createEventSchema.partial();

export const eventQuerySchema = z.object({
  genre: z.string().optional(),
  lookingFor: z.string().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  venueId: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(12),
});
