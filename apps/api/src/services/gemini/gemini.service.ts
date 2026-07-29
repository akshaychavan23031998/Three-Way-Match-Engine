import type { DocumentType } from '@three-way-match/shared';
import { AppError } from '../../utils/app-error.js';
import { createGeminiModel } from './gemini.client.js';

const ensureConfigured = (): void => {
  if (!createGeminiModel())
    throw new AppError(503, 'gemini_not_configured', 'Gemini API key is not configured');
};
export const parseDocument = async (_type: DocumentType, _filePath: string): Promise<unknown> => {
  ensureConfigured();
  throw new AppError(
    501,
    'gemini_parsing_not_implemented',
    'Gemini parsing is not implemented yet',
  );
};
export const parsePurchaseOrder = (filePath: string) => parseDocument('po', filePath);
export const parseGrn = (filePath: string) => parseDocument('grn', filePath);
export const parseInvoice = (filePath: string) => parseDocument('invoice', filePath);
