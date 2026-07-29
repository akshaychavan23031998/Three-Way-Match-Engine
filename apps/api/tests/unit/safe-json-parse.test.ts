import { describe, expect, it } from 'vitest';
import { safeJsonParse } from '../../src/utils/safe-json-parse.js';
describe('safeJsonParse', () => {
  it.each([
    ['plain JSON', '{"value":1}'],
    ['whitespace', ' \n {"value":1} \t'],
    ['json fence', '```json\n{"value":1}\n```'],
    ['generic fence', '```\n{"value":1}\n```'],
    ['commentary', 'Here is the result: {"value":1} Done.'],
  ])('accepts %s', (_label, value) => expect(safeJsonParse(value)).toEqual({ value: 1 }));
  it('rejects malformed JSON', () => expect(safeJsonParse('{bad')).toBeNull());
  it('rejects empty output', () => expect(safeJsonParse('   ')).toBeNull());
});
