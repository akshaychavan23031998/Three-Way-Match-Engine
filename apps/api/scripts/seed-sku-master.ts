import { pathToFileURL } from 'node:url';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { SkuMasterModel, type SkuMasterPersistence } from '../src/models/sku-master.model.js';
import { normalizeCode } from '../src/utils/normalize-code.js';

export const SKU_MASTER_SEED_DATA = [
  {
    skuErpCode: '11423',
    eanCode: 'FG-P-F-0503',
    name: 'PSM Cheesy Spicy Vegetable Momos 24Pcs',
    hsnCode: '19022010',
    uom: 'PKT',
    agreedRate: 220.76,
    mrp: 305,
    priceTolerance: 0.05,
  },
  {
    skuErpCode: '11797',
    eanCode: 'FG-M-F-1703',
    name: 'Meatigo Hot Wings 250g',
    hsnCode: '16023200',
    uom: 'PKT',
    agreedRate: 126.67,
    mrp: 175,
    priceTolerance: 0.05,
  },
  {
    skuErpCode: '18003',
    eanCode: 'FG-M-F-0620',
    name: 'Meatigo Chicken Curry Cuts 450g',
    hsnCode: '02071400',
    uom: 'PKT',
    agreedRate: 141.14,
    mrp: 195,
    priceTolerance: 0.05,
  },
  {
    skuErpCode: '18004',
    eanCode: 'FG-M-F-0619',
    name: 'Meatigo Chicken Boneless Breast 450g',
    hsnCode: '02071400',
    uom: 'PKT',
    agreedRate: 199.05,
    mrp: 275,
    priceTolerance: 0.05,
  },
  {
    skuErpCode: '398656',
    eanCode: 'FG-M-F-0602',
    name: 'Meatigo Chicken Drumsticks 450g',
    hsnCode: '02071400',
    uom: 'PKT',
    agreedRate: 188.19,
    mrp: 260,
    priceTolerance: 0.05,
  },
] as const;

export interface SeedResult {
  created: number;
  updated: number;
  unchanged: number;
}

const comparableFields = [
  'skuErpCode',
  'normalizedSkuErpCode',
  'eanCode',
  'normalizedEanCode',
  'name',
  'hsnCode',
  'uom',
  'agreedRate',
  'mrp',
  'priceTolerance',
] as const;

export const seedSkuMaster = async (): Promise<SeedResult> => {
  const normalizedCodes = SKU_MASTER_SEED_DATA.map((item) => normalizeCode(item.skuErpCode));
  const existing = await SkuMasterModel.find({
    normalizedSkuErpCode: { $in: normalizedCodes },
  })
    .lean()
    .exec();
  const existingByCode = new Map(existing.map((item) => [item.normalizedSkuErpCode, item]));
  const result: SeedResult = { created: 0, updated: 0, unchanged: 0 };

  for (const seed of SKU_MASTER_SEED_DATA) {
    const normalizedSkuErpCode = normalizeCode(seed.skuErpCode);
    const values: Omit<SkuMasterPersistence, 'createdAt' | 'updatedAt'> = {
      ...seed,
      normalizedSkuErpCode,
      normalizedEanCode: normalizeCode(seed.eanCode),
    };
    const current = existingByCode.get(normalizedSkuErpCode);
    if (current && comparableFields.every((field) => current[field] === values[field])) {
      result.unchanged += 1;
      continue;
    }

    await SkuMasterModel.updateOne(
      { normalizedSkuErpCode },
      { $set: values },
      { upsert: true, runValidators: true },
    ).exec();
    if (current) result.updated += 1;
    else result.created += 1;
  }

  return result;
};

const run = async (): Promise<void> => {
  try {
    await connectDatabase();
    const result = await seedSkuMaster();
    console.info(
      `SKU seed complete: created=${result.created}, updated=${result.updated}, unchanged=${result.unchanged}`,
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown seed error';
    console.error(`SKU seed failed: ${message}`);
    process.exitCode = 1;
  } finally {
    await disconnectDatabase();
  }
};

const entryPath = process.argv[1];
if (entryPath && import.meta.url === pathToFileURL(entryPath).href) {
  await run();
}
