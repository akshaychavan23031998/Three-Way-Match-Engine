import type { RequestHandler } from 'express';
import { AppError } from '../utils/app-error.js';

export const notFoundMiddleware: RequestHandler = (req, _res, next) => {
  next(
    new AppError(404, 'route_not_found', `Route ${req.method} ${req.originalUrl} was not found`),
  );
};
