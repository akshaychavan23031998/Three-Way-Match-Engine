import { Router } from 'express';
import { login } from '../controllers/auth.controller.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { loginSchema } from '../schemas/auth.schema.js';
export const authRouter = Router();
authRouter.post('/login', validateBody(loginSchema), login);
