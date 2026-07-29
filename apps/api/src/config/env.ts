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
  PORT: positiveInteger('PORT', 4000),
  MONGODB_URI: z.string().min(1),
  CORS_ORIGIN: z.string().url(),
  AUTH_TOKEN: z.string().min(1),
  GEMINI_API_KEY: z.string().default(''),
  GEMINI_MODEL: z.string().min(1).default('gemini-2.5-flash'),
  UPLOAD_DIR: z.string().min(1).default('uploads'),
  MAX_UPLOAD_SIZE_BYTES: positiveInteger('MAX_UPLOAD_SIZE_BYTES', 10 * 1024 * 1024),
});

const defaults =
  process.env.NODE_ENV === 'test'
    ? {
        MONGODB_URI: 'mongodb://localhost:27017/three_way_match_engine_test',
        CORS_ORIGIN: 'http://localhost:3000',
        AUTH_TOKEN: 'test-token',
      }
    : {};

const legacyUploadBytes = process.env.MAX_UPLOAD_SIZE_MB
  ? String(Number(process.env.MAX_UPLOAD_SIZE_MB) * 1024 * 1024)
  : undefined;
const result = schema.safeParse({
  ...defaults,
  ...process.env,
  ...((process.env.CORS_ORIGIN ?? process.env.CLIENT_URL)
    ? { CORS_ORIGIN: process.env.CORS_ORIGIN ?? process.env.CLIENT_URL }
    : {}),
  ...((process.env.AUTH_TOKEN ?? process.env.STATIC_AUTH_TOKEN)
    ? { AUTH_TOKEN: process.env.AUTH_TOKEN ?? process.env.STATIC_AUTH_TOKEN }
    : {}),
  ...((process.env.MAX_UPLOAD_SIZE_BYTES ?? legacyUploadBytes)
    ? { MAX_UPLOAD_SIZE_BYTES: process.env.MAX_UPLOAD_SIZE_BYTES ?? legacyUploadBytes }
    : {}),
});
if (!result.success) {
  const issues = result.error.issues
    .map((issue) => `${issue.path.join('.') || 'environment'}: ${issue.message}`)
    .join('; ');
  throw new Error(`Invalid environment configuration: ${issues}`);
}

export type Environment = z.infer<typeof schema>;
export const env: Environment = result.data;
