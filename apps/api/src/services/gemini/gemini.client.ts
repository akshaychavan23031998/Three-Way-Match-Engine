import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../../config/env.js';
export const createGeminiModel = () =>
  env.GEMINI_API_KEY
    ? new GoogleGenerativeAI(env.GEMINI_API_KEY).getGenerativeModel({ model: env.GEMINI_MODEL })
    : null;
