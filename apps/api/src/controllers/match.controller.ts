import type { RequestHandler } from 'express';
import { AppError } from '../utils/app-error.js';

export const getMatch: RequestHandler = (_req, _res, next) => {
  next(new AppError(501, 'not_implemented', 'This endpoint has not been implemented yet'));
};
