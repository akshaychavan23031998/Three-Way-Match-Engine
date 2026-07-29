import type { ErrorRequestHandler } from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import { ZodError } from 'zod';
import { env } from '../config/env.js';
import { AppError } from '../utils/app-error.js';

interface ErrorDescriptor {
  statusCode: number;
  code: string;
  message: string;
  details: unknown;
}

const describeError = (error: unknown): ErrorDescriptor => {
  if (error instanceof AppError) {
    return {
      statusCode: error.statusCode,
      code: error.code,
      message: error.message,
      details: error.details,
    };
  }
  if (error instanceof ZodError) {
    return {
      statusCode: 400,
      code: 'validation_error',
      message: 'Request validation failed',
      details: error.flatten(),
    };
  }
  if (error instanceof mongoose.Error.ValidationError) {
    return {
      statusCode: 400,
      code: 'database_validation_error',
      message: 'The supplied data is invalid',
      details: Object.keys(error.errors),
    };
  }
  if (error instanceof mongoose.Error.CastError) {
    return {
      statusCode: 400,
      code: 'invalid_identifier',
      message: 'The supplied identifier is invalid',
      details: null,
    };
  }
  if (error instanceof multer.MulterError) {
    const isSizeError = error.code === 'LIMIT_FILE_SIZE';
    return {
      statusCode: isSizeError ? 413 : 400,
      code: isSizeError ? 'file_too_large' : 'upload_error',
      message: isSizeError ? 'The uploaded file exceeds the allowed size' : 'File upload failed',
      details: null,
    };
  }
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 11000
  ) {
    return {
      statusCode: 409,
      code: 'duplicate_key',
      message: 'A record with the same unique value already exists',
      details: null,
    };
  }
  return {
    statusCode: 500,
    code: 'internal_server_error',
    message: 'An unexpected error occurred',
    details: null,
  };
};

const redact = (value: string): string => {
  const secrets = [env.GEMINI_API_KEY, env.STATIC_AUTH_TOKEN, env.MONGODB_URI].filter(Boolean);
  return secrets.reduce((sanitized, secret) => sanitized.replaceAll(secret, '[REDACTED]'), value);
};

export const errorMiddleware: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
  const descriptor = describeError(error);
  const isOperational = error instanceof AppError && error.isOperational;

  if (!isOperational) {
    const internalMessage =
      error instanceof Error
        ? env.NODE_ENV === 'production'
          ? error.message
          : (error.stack ?? error.message)
        : String(error);
    console.error(`API error: ${redact(internalMessage)}`);
  }

  res.status(descriptor.statusCode).json({
    success: false,
    error: {
      code: descriptor.code,
      message: descriptor.message,
      details: descriptor.details,
    },
  });
};
