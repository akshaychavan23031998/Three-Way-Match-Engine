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

export const validateParams =
  (schema: ZodType, code = 'validation_error'): RequestHandler =>
  (req, _res, next) => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      next(new AppError(400, code, 'Request validation failed', result.error.flatten()));
      return;
    }
    req.params = result.data as Record<string, string>;
    next();
  };

export const validateQuery =
  (schema: ZodType): RequestHandler =>
  (req, _res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      next(
        new AppError(400, 'validation_error', 'Request validation failed', result.error.flatten()),
      );
      return;
    }
    req.query = result.data as typeof req.query;
    next();
  };
