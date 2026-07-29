import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

describe('shared workspace runtime package', () => {
  it('resolves and imports compiled JavaScript', async () => {
    const resolved = createRequire(import.meta.url).resolve('@three-way-match/shared');

    expect(resolved.replaceAll('\\', '/')).toMatch(/\/dist\/index\.js$/);
    expect(resolved.replaceAll('\\', '/')).not.toContain('/src/');
    await expect(import('@three-way-match/shared')).resolves.toBeDefined();
  });
});
