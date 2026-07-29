import { describe, expect, it, vi } from 'vitest';
import * as client from '../../src/services/gemini/gemini.client.js';
import { parseDocument } from '../../src/services/gemini/gemini.service.js';

describe('Gemini service boundary', () => {
  it('accepts fenced model JSON', async () => {
    vi.spyOn(client, 'parseDocumentWithGemini').mockResolvedValueOnce(
      '```json\n{"poNumber":"PO-1"}\n```',
    );
    await expect(parseDocument('purchase_order', 'stored.pdf', 'application/pdf')).resolves.toEqual(
      {
        poNumber: 'PO-1',
      },
    );
  });
  it.each(['', '{malformed'])('maps unusable output to document_parse_failed', async (output) => {
    vi.spyOn(client, 'parseDocumentWithGemini').mockResolvedValueOnce(output);
    await expect(parseDocument('grn', 'stored.pdf', 'application/pdf')).rejects.toMatchObject({
      statusCode: 422,
      code: 'document_parse_failed',
    });
  });
  it('maps external failures without leaking details', async () => {
    vi.spyOn(client, 'parseDocumentWithGemini').mockRejectedValueOnce(
      new Error('external response secret'),
    );
    await expect(parseDocument('invoice', 'stored.pdf', 'application/pdf')).rejects.toMatchObject({
      statusCode: 503,
      code: 'document_parser_unavailable',
      details: null,
    });
  });
});
