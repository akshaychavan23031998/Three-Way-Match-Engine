export const buildGrnPrompt = (): string =>
  'Extract this GRN. Return JSON only; no Markdown fences. Do not invent values. Use null for missing optional values, preserve item codes as strings, return dates as YYYY-MM-DD, and extract all visible line items.';
