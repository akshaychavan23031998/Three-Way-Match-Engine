import { z } from 'zod';

export const tokenLoginSchema = z.object({
  token: z.string().trim().min(1, 'Bearer token is required'),
});
