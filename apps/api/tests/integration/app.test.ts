import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../../src/app.js';

describe('API foundation', () => {
  const validToken = 'test-token';
  const swaggerCsp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
  ];

  it('returns health with the standard success structure', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      data: {
        message: 'Three-Way Match Engine API is running',
        environment: 'test',
      },
    });
    expect(new Date(response.body.data.timestamp).toISOString()).toBe(response.body.data.timestamp);
  });

  it('serves Swagger HTML from its canonical trailing-slash URL', async () => {
    const redirect = await request(app).get('/api/docs');
    expect(redirect.status).toBe(308);
    expect(redirect.headers.location).toBe('/api/docs/');
    for (const directive of swaggerCsp) {
      expect(redirect.headers['content-security-policy']).toContain(directive);
    }

    const response = await request(app).get('/api/docs/');
    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/html');
    expect(response.text).toContain('<title>Swagger UI</title>');
    expect(response.text).toContain('./swagger-ui.css');
    expect(response.text).toContain('./swagger-ui-init.js');
    expect(response.text).toContain('./swagger-ui-bundle.js');
    expect(response.text).toContain('./swagger-ui-standalone-preset.js');
    expect(response.text).not.toContain('src="/swagger-ui');
    expect(response.text).not.toContain('href="/swagger-ui');
    for (const directive of swaggerCsp) {
      expect(response.headers['content-security-policy']).toContain(directive);
    }
  });

  it.each([
    ['swagger-ui.css', 'text/css', '.swagger-ui'],
    ['swagger-ui-bundle.js', 'application/javascript', 'SwaggerUIBundle'],
    ['swagger-ui-standalone-preset.js', 'application/javascript', 'SwaggerUIStandalonePreset'],
    ['swagger-ui-init.js', 'application/javascript', 'SwaggerUIBundle'],
  ])(
    'serves Swagger asset %s without redirecting or returning HTML',
    async (asset, contentType, bodyMarker) => {
      const response = await request(app).get(`/api/docs/${asset}`);
      expect(response.status).toBe(200);
      expect(response.headers.location).toBeUndefined();
      expect(response.headers['content-type']).toContain(contentType);
      expect(response.text.trimStart()).not.toMatch(/^<!DOCTYPE html>/i);
      expect(response.text).toContain(bodyMarker);
      for (const directive of swaggerCsp) {
        expect(response.headers['content-security-policy']).toContain(directive);
      }
    },
  );

  it('retains the stricter global Helmet CSP outside Swagger', async () => {
    const response = await request(app).get('/api/health');
    const csp = response.headers['content-security-policy'];
    expect(csp).toContain("script-src 'self'");
    expect(csp).toContain("script-src-attr 'none'");
    expect(csp).not.toContain("script-src 'self' 'unsafe-inline'");
  });

  it.each(['http://localhost:3000', 'https://three-way-match-web.vercel.app'])(
    'allows configured CORS origin %s',
    async (origin) => {
      const response = await request(app).get('/api/health').set('Origin', origin);
      expect(response.status).toBe(200);
      expect(response.headers['access-control-allow-origin']).toBe(origin);
    },
  );

  it('rejects an unknown browser origin', async () => {
    const response = await request(app)
      .get('/api/health')
      .set('Origin', 'https://untrusted.example');
    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('cors_origin_denied');
  });

  it('allows requests without an Origin header', async () => {
    expect((await request(app).get('/api/health')).status).toBe(200);
  });

  it('supports authenticated OPTIONS preflight', async () => {
    const response = await request(app)
      .options('/api/documents')
      .set('Origin', 'https://three-way-match-web.vercel.app')
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'authorization,content-type');
    expect(response.status).toBe(204);
    expect(response.headers['access-control-allow-methods']).toContain('OPTIONS');
    expect(response.headers['access-control-allow-headers']).toContain('Authorization');
  });

  it('logs in with valid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'admin' });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      data: { token: validToken, tokenType: 'Bearer' },
    });
  });

  it('validates a valid token without depending on a paginated resource', async () => {
    const response = await request(app)
      .get('/api/auth/validate')
      .set('Authorization', `Bearer ${validToken}`);
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: { authenticated: true },
    });
  });

  it('rejects token validation without a bearer token', async () => {
    const response = await request(app).get('/api/auth/validate');
    expect(response.status).toBe(401);
  });

  it('reports database readiness without exposing connection details', async () => {
    const response = await request(app).get('/api/ready');
    expect([200, 503]).toContain(response.status);
    if (response.status === 200) {
      expect(response.body).toMatchObject({
        success: true,
        data: { status: 'ready', database: 'connected' },
      });
    } else {
      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'database_unavailable',
          message: 'The database is temporarily unavailable',
          details: null,
        },
      });
    }
    expect(JSON.stringify(response.body)).not.toContain('mongodb://');
  });

  it('rejects an invalid login email', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'not-an-email', password: 'admin' });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('validation_error');
  });

  it('rejects an empty login password', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: '' });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('validation_error');
  });

  it('rejects an unauthenticated protected route', async () => {
    const response = await request(app).get('/api/documents');

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('unauthorized');
  });

  it('rejects an invalid bearer token', async () => {
    const response = await request(app)
      .get('/api/documents')
      .set('Authorization', 'Bearer invalid-token');

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('unauthorized');
  });

  it('allows a valid bearer token to reach a protected placeholder', async () => {
    const response = await request(app)
      .get('/api/match/test-po')
      .set('Authorization', `Bearer ${validToken}`);

    expect(response.status).toBe(501);
    expect(response.body).toEqual({
      success: false,
      error: {
        code: 'not_implemented',
        message: 'This endpoint has not been implemented yet',
        details: null,
      },
    });
  });

  it('returns a consistent 404 for unknown routes', async () => {
    const response = await request(app).get('/api/unknown-route');

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('route_not_found');
    expect(response.body.error.message).toContain('GET /api/unknown-route');
  });

  it('does not expose stack traces for unexpected errors', async () => {
    const response = await request(app)
      .get('/api/__test/unexpected-error')
      .set('Authorization', `Bearer ${validToken}`);

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      success: false,
      error: {
        code: 'internal_server_error',
        message: 'An unexpected error occurred',
        details: null,
      },
    });
    expect(JSON.stringify(response.body)).not.toContain('Sensitive stack marker');
    expect(JSON.stringify(response.body)).not.toContain('.test.ts');
  });
});
