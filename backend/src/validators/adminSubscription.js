import { z } from 'zod';

export const grantFreePassSchema = z
  .object({
    endDate: z.string().trim().min(1),
    note: z.string().trim().max(2000).optional(),
  })
  .strict();

export const revokeFreePassSchema = z
  .object({
    note: z.string().trim().max(2000).optional(),
  })
  .strict();
