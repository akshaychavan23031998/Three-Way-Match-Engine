import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';
import { AppError } from '../utils/app-error.js';

export const validateBody =
  (schema: ZodType): RequestHandler =>
  (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      next(
        new AppError(400, 'validation_error', 'Request validation failed', result.error.flatten()),
      );
      return;
    }
    req.body = result.data;
    next();
  };
