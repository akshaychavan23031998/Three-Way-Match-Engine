import mongoose from 'mongoose';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  connectDatabase,
  resetDatabaseConnectionCacheForTests,
} from '../../src/config/database.js';

afterEach(() => {
  vi.restoreAllMocks();
  resetDatabaseConnectionCacheForTests();
});

describe('serverless database connection cache', () => {
  it('reuses an established connection', async () => {
    const connect = vi.spyOn(mongoose, 'connect').mockResolvedValue(mongoose);
    vi.spyOn(mongoose.connection, 'readyState', 'get').mockReturnValue(1);
    await connectDatabase();
    await connectDatabase();
    expect(connect).not.toHaveBeenCalled();
  });

  it('shares one connection attempt across concurrent cold-start requests', async () => {
    let resolveConnection: ((value: typeof mongoose) => void) | undefined;
    const pending = new Promise<typeof mongoose>((resolve) => {
      resolveConnection = resolve;
    });
    const connect = vi.spyOn(mongoose, 'connect').mockReturnValue(pending);
    vi.spyOn(mongoose.connection, 'readyState', 'get').mockReturnValue(0);
    const first = connectDatabase();
    const second = connectDatabase();
    resolveConnection?.(mongoose);
    await Promise.all([first, second]);
    expect(connect).toHaveBeenCalledOnce();
  });

  it('clears a failed cached attempt so a later request can retry', async () => {
    const connect = vi
      .spyOn(mongoose, 'connect')
      .mockRejectedValueOnce(new Error('first failure'))
      .mockResolvedValueOnce(mongoose);
    vi.spyOn(mongoose.connection, 'readyState', 'get').mockReturnValue(0);
    await expect(connectDatabase()).rejects.toThrow('Unable to connect to MongoDB');
    await expect(connectDatabase()).resolves.toBeUndefined();
    expect(connect).toHaveBeenCalledTimes(2);
  });
});
