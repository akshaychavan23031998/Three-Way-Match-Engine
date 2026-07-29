import type {
  CreateSkuMasterInput,
  PaginationMeta,
  SkuMaster,
  SkuMasterListQuery,
  UpdateSkuMasterInput,
} from '@three-way-match/shared';
import {
  countSkuMasters,
  createSkuMaster as createRecord,
  deleteSkuMasterById,
  findSkuMasterById,
  findSkuMasterByNormalizedEanCode,
  findSkuMasterByNormalizedErpCode,
  listSkuMasters as listRecords,
  updateSkuMasterById,
  type CreateSkuMasterPersistenceInput,
  type SkuMasterRecord,
  type SkuMasterUpdate,
} from '../../repositories/sku-master.repository.js';
import { AppError } from '../../utils/app-error.js';
import { normalizeCode } from '../../utils/normalize-code.js';

const duplicateErpError = (): AppError =>
  new AppError(
    409,
    'duplicate_sku_erp_code',
    'A SKU Master record with this ERP code already exists',
  );

const duplicateEanError = (): AppError =>
  new AppError(409, 'duplicate_ean_code', 'A SKU Master record with this EAN code already exists');

const notFoundError = (): AppError =>
  new AppError(404, 'sku_master_not_found', 'SKU Master record was not found');

const serializeSkuMaster = (record: SkuMasterRecord): SkuMaster => ({
  id: record._id.toString(),
  skuErpCode: record.skuErpCode,
  name: record.name,
  ...(record.eanCode ? { eanCode: record.eanCode } : {}),
  ...(record.hsnCode ? { hsnCode: record.hsnCode } : {}),
  ...(record.uom ? { uom: record.uom } : {}),
  ...(record.agreedRate !== undefined ? { agreedRate: record.agreedRate } : {}),
  ...(record.mrp !== undefined ? { mrp: record.mrp } : {}),
  priceTolerance: record.priceTolerance,
  createdAt: record.createdAt.toISOString(),
  updatedAt: record.updatedAt.toISOString(),
});

const assertUniqueCodes = async (
  normalizedErpCode: string,
  normalizedEanCode?: string,
  excludeId?: string,
): Promise<void> => {
  if (await findSkuMasterByNormalizedErpCode(normalizedErpCode, excludeId)) {
    throw duplicateErpError();
  }
  if (normalizedEanCode && (await findSkuMasterByNormalizedEanCode(normalizedEanCode, excludeId))) {
    throw duplicateEanError();
  }
};

const mapDuplicateDatabaseError = (error: unknown): never => {
  if (typeof error === 'object' && error !== null && 'code' in error && error.code === 11000) {
    const keyPattern =
      'keyPattern' in error && typeof error.keyPattern === 'object' && error.keyPattern !== null
        ? error.keyPattern
        : {};
    if ('normalizedEanCode' in keyPattern) throw duplicateEanError();
    throw duplicateErpError();
  }
  throw error;
};

export const createSkuMaster = async (input: CreateSkuMasterInput): Promise<SkuMaster> => {
  const normalizedSkuErpCode = normalizeCode(input.skuErpCode);
  const normalizedEanCode = input.eanCode ? normalizeCode(input.eanCode) : undefined;
  await assertUniqueCodes(normalizedSkuErpCode, normalizedEanCode);

  const persistenceInput: CreateSkuMasterPersistenceInput = {
    skuErpCode: input.skuErpCode.trim(),
    normalizedSkuErpCode,
    name: input.name.trim(),
    priceTolerance: input.priceTolerance ?? 0.05,
    ...(input.eanCode && normalizedEanCode
      ? { eanCode: input.eanCode.trim(), normalizedEanCode }
      : {}),
    ...(input.hsnCode ? { hsnCode: input.hsnCode.trim() } : {}),
    ...(input.uom ? { uom: input.uom.trim() } : {}),
    ...(input.agreedRate !== undefined ? { agreedRate: input.agreedRate } : {}),
    ...(input.mrp !== undefined ? { mrp: input.mrp } : {}),
  };

  try {
    return serializeSkuMaster(await createRecord(persistenceInput));
  } catch (error: unknown) {
    return mapDuplicateDatabaseError(error);
  }
};

export const listSkuMasters = async (
  query: SkuMasterListQuery,
): Promise<{ data: SkuMaster[]; meta: PaginationMeta }> => {
  const [records, total] = await Promise.all([listRecords(query), countSkuMasters(query.search)]);
  return {
    data: records.map(serializeSkuMaster),
    meta: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / query.limit),
    },
  };
};

export const getSkuMasterById = async (id: string): Promise<SkuMaster> => {
  const record = await findSkuMasterById(id);
  if (!record) throw notFoundError();
  return serializeSkuMaster(record);
};

const hasOwn = (value: object, key: string): boolean =>
  Object.prototype.hasOwnProperty.call(value, key);

export const updateSkuMaster = async (
  id: string,
  input: UpdateSkuMasterInput,
): Promise<SkuMaster> => {
  const existing = await findSkuMasterById(id);
  if (!existing) throw notFoundError();

  const normalizedSkuErpCode =
    input.skuErpCode === undefined
      ? existing.normalizedSkuErpCode
      : normalizeCode(input.skuErpCode);
  const normalizedEanCode = hasOwn(input, 'eanCode')
    ? input.eanCode
      ? normalizeCode(input.eanCode)
      : undefined
    : existing.normalizedEanCode;

  await assertUniqueCodes(normalizedSkuErpCode, normalizedEanCode, id);

  const update: SkuMasterUpdate = { set: {}, unset: [] };
  if (input.skuErpCode !== undefined) {
    update.set.skuErpCode = input.skuErpCode.trim();
    update.set.normalizedSkuErpCode = normalizedSkuErpCode;
  }
  if (input.name !== undefined) update.set.name = input.name.trim();
  if (input.agreedRate !== undefined) update.set.agreedRate = input.agreedRate;
  if (input.mrp !== undefined) update.set.mrp = input.mrp;
  if (input.priceTolerance !== undefined) update.set.priceTolerance = input.priceTolerance;

  for (const field of ['hsnCode', 'uom'] as const) {
    if (!hasOwn(input, field)) continue;
    if (input[field]) update.set[field] = input[field].trim();
    else update.unset.push(field);
  }
  if (hasOwn(input, 'eanCode')) {
    if (input.eanCode && normalizedEanCode) {
      update.set.eanCode = input.eanCode.trim();
      update.set.normalizedEanCode = normalizedEanCode;
    } else {
      update.unset.push('eanCode', 'normalizedEanCode');
    }
  }

  try {
    const updated = await updateSkuMasterById(id, update);
    if (!updated) throw notFoundError();
    return serializeSkuMaster(updated);
  } catch (error: unknown) {
    if (error instanceof AppError) throw error;
    return mapDuplicateDatabaseError(error);
  }
};

export const deleteSkuMaster = async (id: string): Promise<void> => {
  if (!(await deleteSkuMasterById(id))) throw notFoundError();
};
