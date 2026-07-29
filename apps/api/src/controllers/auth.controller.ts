import type { RequestHandler } from 'express';
import type { z } from 'zod';
import { loginSchema } from '../schemas/auth.schema.js';
import { authenticate } from '../services/auth/auth.service.js';
import { sendSuccess } from '../utils/response.js';

type LoginBody = z.infer<typeof loginSchema>;

export const login: RequestHandler<Record<string, never>, unknown, LoginBody> = (req, res) => {
  sendSuccess(res, authenticate(req.body.email, req.body.password));
};
