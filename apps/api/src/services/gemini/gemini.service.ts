import type { DocumentType } from '@three-way-match/shared';
import { AppError } from '../../utils/app-error.js';
import { safeJsonParse } from '../../utils/safe-json-parse.js';
import { parseDocumentWithGemini } from './gemini.client.js';

export const parseDocument = async (
  documentType: DocumentType,
  storedFileName: string,
  mimeType: string,
): Promise<unknown> => {
  let response: string;
  try {
    response = await parseDocumentWithGemini({ documentType, storedFileName, mimeType });
  } catch {
    throw new AppError(
      503,
      'document_parser_unavailable',
      'The document parsing service is temporarily unavailable',
    );
  }
  const parsed = safeJsonParse<unknown>(response);
  if (!parsed)
    throw new AppError(422, 'document_parse_failed', 'The uploaded document could not be parsed');
  return parsed;
};
