import { GoogleGenerativeAI } from '@google/generative-ai';
import type { DocumentType } from '@three-way-match/shared';
import { env } from '../../config/env.js';
import { readStoredFile } from '../documents/file-storage.service.js';
import { buildGrnPrompt } from './prompts/grn.prompt.js';
import { buildInvoicePrompt } from './prompts/invoice.prompt.js';
import { buildPoPrompt } from './prompts/po.prompt.js';

export interface GeminiDocumentInput {
  documentType: DocumentType;
  storedFileName: string;
  mimeType: string;
}
const promptFor = (type: DocumentType): string => {
  switch (type) {
    case 'purchase_order':
      return buildPoPrompt();
    case 'grn':
      return buildGrnPrompt();
    case 'invoice':
      return buildInvoicePrompt();
  }
};
export const parseDocumentWithGemini = async (input: GeminiDocumentInput): Promise<string> => {
  if (!env.GEMINI_API_KEY) throw new Error('Gemini is not configured');
  const model = new GoogleGenerativeAI(env.GEMINI_API_KEY).getGenerativeModel({
    model: env.GEMINI_MODEL,
    generationConfig: { responseMimeType: 'application/json' },
  });
  const data = (await readStoredFile(input.storedFileName)).toString('base64');
  let timeout: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      model
        .generateContent([
          { inlineData: { data, mimeType: input.mimeType } },
          { text: promptFor(input.documentType) },
        ])
        .then((result) => result.response.text()),
      new Promise<never>((_resolve, reject) => {
        timeout = setTimeout(() => reject(new Error('Gemini request timed out')), 30_000);
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
};
