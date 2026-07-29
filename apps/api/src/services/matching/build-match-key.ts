import { normalizeCode } from '../../utils/normalize-code.js';
export const buildMatchKey = (code: string): string => normalizeCode(code);
