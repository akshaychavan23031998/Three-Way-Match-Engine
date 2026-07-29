import type { RequestHandler } from 'express';
import { AppError } from '../utils/app-error.js';

const notImplemented: RequestHandler = (_req, _res, next) => {
  next(new AppError(501, 'not_implemented', 'This endpoint has not been implemented yet'));
};

export const upload = notImplemented;
export const list = notImplemented;
export const getById = notImplemented;
export const getFile = notImplemented;
