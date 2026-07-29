import { Types } from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const findRecords = vi.fn();
vi.mock('../../src/repositories/sku-master.repository.js', () => ({
  findSkuMastersByNormalizedCodes: findRecords,
}));
const { resolveSkuItems } = await import('../../src/services/sku/sku-resolution.service.js');
const record = (erp: string, ean: string, id = new Types.ObjectId()) => ({
  _id: id,
  skuErpCode: erp.toUpperCase(),
  normalizedSkuErpCode: erp,
  name: erp,
  eanCode: ean.toUpperCase(),
  normalizedEanCode: ean,
  priceTolerance: 0.05,
  createdAt: new Date(),
  updatedAt: new Date(),
});
beforeEach(() => findRecords.mockReset());

describe('batch SKU resolution', () => {
  it('resolves by ERP', async () => {
    findRecords.mockResolvedValue([record('erp', 'ean')]);
    expect((await resolveSkuItems([{ skuErpCode: ' ERP ' }]))[0]?.resolutionMethod).toBe('erp');
  });
  it('falls back to EAN', async () => {
    findRecords.mockResolvedValue([record('erp', 'ean')]);
    expect((await resolveSkuItems([{ eanCode: ' EAN ' }]))[0]?.resolutionMethod).toBe('ean');
  });
  it('gives ERP priority when both resolve to the same record', async () => {
    findRecords.mockResolvedValue([record('erp', 'ean')]);
    expect(
      (await resolveSkuItems([{ skuErpCode: 'erp', eanCode: 'ean' }]))[0]?.resolutionMethod,
    ).toBe('erp');
  });
  it('reports ERP/EAN conflicts', async () => {
    findRecords.mockResolvedValue([record('erp', 'one'), record('other', 'ean')]);
    expect(
      (await resolveSkuItems([{ skuErpCode: 'erp', eanCode: 'ean' }]))[0]?.resolutionMethod,
    ).toBe('conflict');
  });
  it('returns unresolved without fuzzy matching', async () => {
    findRecords.mockResolvedValue([]);
    expect((await resolveSkuItems([{ skuErpCode: 'unknown' }]))[0]?.resolutionMethod).toBe(
      'unresolved',
    );
  });
  it('batch-loads all codes once', async () => {
    findRecords.mockResolvedValue([]);
    await resolveSkuItems([{ skuErpCode: 'a' }, { eanCode: 'b' }]);
    expect(findRecords).toHaveBeenCalledTimes(1);
  });
});
