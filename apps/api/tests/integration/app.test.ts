import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../../src/app.js';

describe('API foundation', () => {
  const validToken = 'test-token';

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
