import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { AxiosError } from 'axios';
import { describe, expect, it, vi } from 'vitest';
import { ApiClient, ApiError, setUnauthorizedHandler } from '@/lib/api-client';
import { authStorage } from '@/lib/auth-storage';

const response = (
  config: InternalAxiosRequestConfig,
  status: number,
  data: unknown,
): AxiosResponse => ({
  config,
  data,
  status,
  statusText: String(status),
  headers: {},
});

describe('API client', () => {
  it('parses a success envelope', async () => {
    const adapter: AxiosAdapter = async (config) =>
      response(config, 200, { success: true, data: { value: 7 } });
    await expect(new ApiClient('/api', adapter).request({ url: '/test' })).resolves.toEqual({
      value: 7,
    });
  });
  it('parses an error envelope', async () => {
    const adapter: AxiosAdapter = async (config) => {
      const result = response(config, 400, {
        success: false,
        error: { code: 'validation_error', message: 'Invalid value', details: null },
      });
      throw new AxiosError('Bad request', 'ERR_BAD_REQUEST', config, undefined, result);
    };
    await expect(new ApiClient('/api', adapter).request({ url: '/test' })).rejects.toMatchObject({
      status: 400,
      code: 'validation_error',
      message: 'Invalid value',
    });
  });
  it('handles HTTP 204', async () => {
    const adapter: AxiosAdapter = async (config) => response(config, 204, undefined);
    await expect(
      new ApiClient('/api', adapter).request<void>({ url: '/test' }),
    ).resolves.toBeUndefined();
  });
  it('attaches the bearer token', async () => {
    authStorage.set('secret-token');
    const adapter = vi.fn<AxiosAdapter>(async (config) =>
      response(config, 200, { success: true, data: true }),
    );
    await new ApiClient('/api', adapter).request({ url: '/test' });
    expect(adapter.mock.calls[0]?.[0].headers?.Authorization).toBe('Bearer secret-token');
  });
  it('validates auth against the non-paginated auth endpoint', async () => {
    const adapter = vi.fn<AxiosAdapter>(async (config) =>
      response(config, 200, { success: true, data: { authenticated: true } }),
    );
    await expect(new ApiClient('/api', adapter).validateToken()).resolves.toEqual({
      authenticated: true,
    });
    expect(adapter.mock.calls[0]?.[0].url).toBe('/auth/validate');
  });
  it('clears auth and invokes the 401 handler once', async () => {
    authStorage.set('secret-token');
    const handler = vi.fn();
    setUnauthorizedHandler(handler);
    const adapter: AxiosAdapter = async (config) => {
      const result = response(config, 401, {
        success: false,
        error: { code: 'unauthorized', message: 'Unauthorized', details: null },
      });
      throw new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, undefined, result);
    };
    await expect(new ApiClient('/api', adapter).request({ url: '/test' })).rejects.toBeInstanceOf(
      ApiError,
    );
    expect(authStorage.get()).toBeNull();
    expect(handler).toHaveBeenCalledOnce();
    setUnauthorizedHandler(undefined);
  });
});
