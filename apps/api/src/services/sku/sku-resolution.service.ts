import { findSkuMastersByNormalizedCodes } from '../../repositories/sku-master.repository.js';
import type { ResolvableItem, SkuResolution } from '../../types/match.types.js';
import { normalizeCode } from '../../utils/normalize-code.js';

const unresolved = (item: ResolvableItem): SkuResolution => ({
  ...(item.skuErpCode ? { skuErpCode: item.skuErpCode } : {}),
  ...(item.eanCode ? { eanCode: item.eanCode } : {}),
  resolutionMethod: 'unresolved',
});

export const resolveSkuItems = async (items: ResolvableItem[]): Promise<SkuResolution[]> => {
  const normalized = items.map((item) => ({
    erp: normalizeCode(item.skuErpCode),
    ean: normalizeCode(item.eanCode),
  }));
  const records = await findSkuMastersByNormalizedCodes(
    [...new Set(normalized.map(({ erp }) => erp).filter(Boolean))],
    [...new Set(normalized.map(({ ean }) => ean).filter(Boolean))],
  );
  const byErp = new Map(records.map((record) => [record.normalizedSkuErpCode, record]));
  const byEan = new Map(
    records.flatMap((record) =>
      record.normalizedEanCode ? [[record.normalizedEanCode, record] as const] : [],
    ),
  );
  return items.map((item, index) => {
    const codes = normalized[index];
    if (!codes) return unresolved(item);
    const erpRecord = codes.erp ? byErp.get(codes.erp) : undefined;
    const eanRecord = codes.ean ? byEan.get(codes.ean) : undefined;
    if (erpRecord && eanRecord && !erpRecord._id.equals(eanRecord._id)) {
      return {
        ...(item.skuErpCode ? { skuErpCode: item.skuErpCode } : {}),
        ...(item.eanCode ? { eanCode: item.eanCode } : {}),
        resolutionMethod: 'conflict',
      };
    }
    const record = erpRecord ?? eanRecord;
    if (!record) return unresolved(item);
    return {
      skuMasterId: record._id.toString(),
      skuErpCode: record.skuErpCode,
      ...(record.eanCode ? { eanCode: record.eanCode } : {}),
      skuName: record.name,
      ...(record.agreedRate !== undefined ? { agreedRate: record.agreedRate } : {}),
      ...(record.mrp !== undefined ? { mrp: record.mrp } : {}),
      priceTolerance: record.priceTolerance,
      resolutionMethod: erpRecord ? 'erp' : 'ean',
    };
  });
};

export class SkuResolutionService {
  resolve(items: ResolvableItem[]): Promise<SkuResolution[]> {
    return resolveSkuItems(items);
  }
}
