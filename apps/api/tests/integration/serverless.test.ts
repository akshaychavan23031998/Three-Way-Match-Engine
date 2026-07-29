import { readFileSync } from 'node:fs';
import path from 'node:path';
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
    const html = await request(deployedApp).get('/api/docs/');
    expect(html.status).toBe(200);
    expect(html.text).toContain('./swagger-ui-init.js');
    expect(html.headers['content-security-policy']).toContain("script-src 'self' 'unsafe-inline'");
    for (const [asset, contentType] of [
      ['swagger-ui.css', 'text/css'],
      ['swagger-ui-bundle.js', 'application/javascript'],
      ['swagger-ui-standalone-preset.js', 'application/javascript'],
      ['swagger-ui-init.js', 'application/javascript'],
    ]) {
      const response = await request(deployedApp).get(`/api/docs/${asset}`);
      expect(response.status).toBe(200);
      expect(response.headers.location).toBeUndefined();
      expect(response.headers['content-type']).toContain(contentType);
      expect(response.text.trimStart()).not.toMatch(/^<!DOCTYPE html>/i);
    }
    expect(connect).not.toHaveBeenCalled();
  });

  it('includes the Swagger static distribution in the Vercel function bundle', () => {
    const config = JSON.parse(readFileSync(path.resolve(process.cwd(), 'vercel.json'), 'utf8')) as {
      functions?: Record<string, { includeFiles?: string }>;
    };
    expect(config.functions?.['index.ts']?.includeFiles).toBe(
      '../../node_modules/swagger-ui-dist/**',
    );
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
