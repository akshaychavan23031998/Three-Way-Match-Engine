import { z } from 'zod';
export const documentTypeSchema = z.enum(['po', 'grn', 'invoice']);
