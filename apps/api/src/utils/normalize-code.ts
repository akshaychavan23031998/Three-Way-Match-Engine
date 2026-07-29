export const normalizeCode = (value: unknown): string =>
  typeof value === 'string' || typeof value === 'number' ? String(value).trim().toLowerCase() : '';
