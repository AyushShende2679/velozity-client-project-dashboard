import { z } from 'zod';

export const createClientSchema = {
  body: z.object({
    name: z.string().min(2, 'Client name must be at least 2 characters'),
    email: z.string().email('Invalid email').optional(),
    company: z.string().optional(),
  }),
};
