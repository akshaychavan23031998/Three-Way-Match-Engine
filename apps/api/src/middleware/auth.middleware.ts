import { timingSafeEqual } from 'node:crypto';
import type { RequestHandler } from 'express';
import { env } from '../config/env.js';

const unauthorized = (res: Parameters<RequestHandler>[1]): void => {
  res.status(401).json({
    success: false,
    error: { code: 'unauthorized', message: 'A valid bearer token is required', details: null },
  });
};

const tokensMatch = (candidate: string, expected: string): boolean => {
  const candidateBuffer = Buffer.from(candidate);
  const expectedBuffer = Buffer.from(expected);
  return (
    candidateBuffer.length === expectedBuffer.length &&
    timingSafeEqual(candidateBuffer, expectedBuffer)
  );
};

export const requireAuth: RequestHandler = (req, res, next) => {
  const authorization = req.header('authorization');
  const match = authorization?.match(/^Bearer ([^\s]+)$/);

  if (!match?.[1] || !tokensMatch(match[1], env.STATIC_AUTH_TOKEN)) {
    unauthorized(res);
    return;
  }

  req.user = { id: 'static-admin', email: 'admin@example.com', role: 'admin' };
  next();
};
