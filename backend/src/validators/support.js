import { z } from 'zod';

export const createSupportTicketSchema = z
  .object({
    subject: z.string().trim().min(3).max(200),
    message: z.string().trim().min(10).max(5000),
  })
  .strict();

export const updateSupportTicketSchema = z
  .object({
    status: z.enum(['PENDING', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']),
    adminNote: z.string().trim().max(2000).optional(),
  })
  .strict();
