import { env } from '../../config/env.js';

export interface LoginResult {
  token: string;
  tokenType: 'Bearer';
}

export const authenticate = (email: string, password: string): LoginResult => {
  // Input validation occurs at the route boundary. This static authentication is scaffold-only.
  if (!email || !password) {
    throw new Error('Validated credentials are required');
  }

  return { token: env.STATIC_AUTH_TOKEN, tokenType: 'Bearer' };
};
