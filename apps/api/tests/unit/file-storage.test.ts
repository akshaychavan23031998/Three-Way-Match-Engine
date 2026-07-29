import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  deleteStoredFile,
  resolveUploadDirectory,
} from '../../src/services/documents/file-storage.service.js';

const originalVercel = process.env.VERCEL;
afterEach(() => {
  if (originalVercel === undefined) delete process.env.VERCEL;
  else process.env.VERCEL = originalVercel;
});

describe('runtime upload directory', () => {
  it('uses /tmp storage in the Vercel runtime', () => {
    process.env.VERCEL = '1';
    expect(resolveUploadDirectory()).toBe('/tmp/three-way-match-uploads');
  });

  it('uses configured upload storage locally', () => {
    delete process.env.VERCEL;
    expect(resolveUploadDirectory()).toBe(
      path.resolve(process.cwd(), process.env.UPLOAD_DIR ?? ''),
    );
  });

  it('tolerates cleanup when a temporary file is already missing', async () => {
    process.env.VERCEL = '1';
    await expect(deleteStoredFile('missing-file.pdf')).resolves.toBeUndefined();
  });
});
