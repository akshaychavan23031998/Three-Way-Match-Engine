import { Router } from 'express';
import { login, validateAuth } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { loginSchema } from '../schemas/auth.schema.js';
export const authRouter = Router();
authRouter.post('/login', validateBody(loginSchema), login);
authRouter.get('/validate', requireAuth, validateAuth);
