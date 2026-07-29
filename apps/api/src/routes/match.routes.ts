import { Router } from 'express';
import { getMatch } from '../controllers/match.controller.js';
export const matchRouter = Router();
matchRouter.get('/:poNumber', getMatch);
