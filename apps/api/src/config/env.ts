import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const positiveInteger = (name: string, defaultValue: number) =>
  z
    .string()
    .trim()
    .default(String(defaultValue))
    .refine((value) => /^\d+$/.test(value), `${name} must be a positive integer`)
    .transform(Number)
    .refine(
      (value) => Number.isSafeInteger(value) && value > 0,
      `${name} must be a positive integer`,
    );

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: positiveInteger('PORT', 5000),
  MONGODB_URI: z.string().min(1),
  CLIENT_URL: z.string().url(),
  STATIC_AUTH_TOKEN: z.string().min(1),
  GEMINI_API_KEY: z.string().default(''),
  GEMINI_MODEL: z.string().min(1).default('gemini-2.5-flash'),
  UPLOAD_DIR: z.string().min(1).default('uploads'),
  MAX_UPLOAD_SIZE_MB: positiveInteger('MAX_UPLOAD_SIZE_MB', 10),
});

const defaults =
  process.env.NODE_ENV === 'test'
    ? {
        MONGODB_URI: 'mongodb://localhost:27017/three_way_match_engine_test',
        CLIENT_URL: 'http://localhost:3000',
        STATIC_AUTH_TOKEN: 'test-token',
      }
    : {};

const result = schema.safeParse({ ...defaults, ...process.env });
if (!result.success) {
  const issues = result.error.issues
    .map((issue) => `${issue.path.join('.') || 'environment'}: ${issue.message}`)
    .join('; ');
  throw new Error(`Invalid environment configuration: ${issues}`);
}

export type Environment = z.infer<typeof schema>;
export const env: Environment = result.data;
