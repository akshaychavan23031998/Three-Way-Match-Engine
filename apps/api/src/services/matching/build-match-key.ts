import type { MatchLine } from '../../types/match.types.js';
import { normalizeCode } from '../../utils/normalize-code.js';

export const buildMatchKey = (
  line: Pick<
    MatchLine,
    'resolution' | 'skuErpCode' | 'eanCode' | 'sourceType' | 'documentId' | 'lineIndex'
  >,
): string => {
  if (line.resolution.skuMasterId) return `master:${line.resolution.skuMasterId}`;
  const erp = normalizeCode(line.skuErpCode);
  if (erp) return `erp:${erp}`;
  const ean = normalizeCode(line.eanCode);
  if (ean) return `ean:${ean}`;
  return `unresolved:${line.sourceType}:${line.documentId}:${line.lineIndex}`;
};
