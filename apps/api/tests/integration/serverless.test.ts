import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { app } from '../../src/app.js';
import { swaggerSpec } from '../../src/config/swagger.js';
import serverlessApp, { createServerlessApp } from '../../index.js';

const auth = { Authorization: 'Bearer test-token' };

describe('Vercel serverless handler', () => {
  it('imports without opening a network listener', async () => {
    const listen = vi.spyOn(app, 'listen');
    expect(serverlessApp).toBeTypeOf('function');
    expect(listen).not.toHaveBeenCalled();
    listen.mockRestore();
  });

  it('serves health without connecting to MongoDB', async () => {
    const connect = vi.fn<() => Promise<void>>();
    const response = await request(createServerlessApp(connect)).get('/api/health');
    expect(response.status).toBe(200);
    expect(connect).not.toHaveBeenCalled();
  });

  it('serves authenticated token validation without returning the token', async () => {
    const connect = vi.fn<() => Promise<void>>();
    const response = await request(createServerlessApp(connect))
      .get('/api/auth/validate')
      .set(auth);
    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({ authenticated: true });
    expect(JSON.stringify(response.body)).not.toContain('test-token');
  });

  it('returns a safe 503 when a data route cannot connect', async () => {
    const connect = vi.fn<() => Promise<void>>().mockRejectedValue(new Error('secret URI'));
    const response = await request(createServerlessApp(connect)).get('/api/summary').set(auth);
    expect(response.status).toBe(503);
    expect(response.body.error.code).toBe('database_unavailable');
    expect(JSON.stringify(response.body)).not.toContain('secret URI');
  });

  it('returns 404 for an unknown route without connecting to MongoDB', async () => {
    const connect = vi.fn<() => Promise<void>>().mockRejectedValue(new Error('unavailable'));
    const response = await request(createServerlessApp(connect)).get('/api/api/health');
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('route_not_found');
    expect(connect).not.toHaveBeenCalled();
  });

  it('serves Swagger UI and assets without a database connection', async () => {
    const connect = vi.fn<() => Promise<void>>();
    const deployedApp = createServerlessApp(connect);
    expect((await request(deployedApp).get('/api/docs/')).status).toBe(200);
    expect((await request(deployedApp).get('/api/docs/swagger-ui.css')).status).toBe(200);
    expect(connect).not.toHaveBeenCalled();
  });

  it('uses a relative Swagger server and paths with only one API prefix', () => {
    const spec = swaggerSpec as {
      servers?: Array<{ url: string; description?: string }>;
      paths?: Record<string, unknown>;
    };
    expect(spec.servers).toEqual([{ url: '/api', description: 'Current deployment' }]);
    expect(Object.keys(spec.paths ?? {}).every((path) => !path.startsWith('/api/'))).toBe(true);
  });
});
