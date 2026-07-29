import { describe, expect, it } from 'vitest';
import { normalizeCode } from '../../src/utils/normalize-code.js';
describe('normalizeCode', () => {
  it('trims and lowercases while preserving string values', () => {
    expect(normalizeCode('  AbC-001 ')).toBe('abc-001');
    expect(normalizeCode(123)).toBe('123');
    expect(normalizeCode(null)).toBe('');
  });
});
