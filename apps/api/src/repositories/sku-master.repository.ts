import { Types, type FilterQuery, type SortOrder, type UpdateQuery } from 'mongoose';
import { SkuMasterModel, type SkuMasterPersistence } from '../models/sku-master.model.js';
import { escapeRegExp } from '../utils/escape-reg-exp.js';

export interface SkuMasterRecord extends SkuMasterPersistence {
  _id: Types.ObjectId;
}

export type CreateSkuMasterPersistenceInput = Omit<SkuMasterPersistence, 'createdAt' | 'updatedAt'>;

export interface SkuMasterListOptions {
  page: number;
  limit: number;
  search?: string | undefined;
  sortBy: 'createdAt' | 'updatedAt' | 'skuErpCode' | 'name';
  sortOrder: 'asc' | 'desc';
}

export interface SkuMasterUpdate {
  set: Partial<CreateSkuMasterPersistenceInput>;
  unset: Array<'eanCode' | 'normalizedEanCode' | 'hsnCode' | 'uom'>;
}

const duplicateFilter = (
  field: 'normalizedSkuErpCode' | 'normalizedEanCode',
  value: string,
  excludeId?: string,
): FilterQuery<SkuMasterPersistence> => ({
  [field]: value,
  ...(excludeId ? { _id: { $ne: new Types.ObjectId(excludeId) } } : {}),
});

const searchFilter = (search?: string): FilterQuery<SkuMasterPersistence> => {
  if (!search) return {};
  const pattern = new RegExp(escapeRegExp(search.trim()), 'i');
  return {
    $or: [{ skuErpCode: pattern }, { name: pattern }, { eanCode: pattern }, { hsnCode: pattern }],
  };
};

export const createSkuMaster = async (
  input: CreateSkuMasterPersistenceInput,
): Promise<SkuMasterRecord> => {
  const document = await SkuMasterModel.create(input);
  return document.toObject() as SkuMasterRecord;
};

export const findSkuMasterById = async (id: string): Promise<SkuMasterRecord | null> =>
  SkuMasterModel.findById(id).lean<SkuMasterRecord>().exec();

export const findSkuMasterByNormalizedErpCode = async (
  normalizedCode: string,
  excludeId?: string,
): Promise<SkuMasterRecord | null> =>
  SkuMasterModel.findOne(duplicateFilter('normalizedSkuErpCode', normalizedCode, excludeId))
    .lean<SkuMasterRecord>()
    .exec();

export const findSkuMasterByNormalizedEanCode = async (
  normalizedCode: string,
  excludeId?: string,
): Promise<SkuMasterRecord | null> =>
  SkuMasterModel.findOne(duplicateFilter('normalizedEanCode', normalizedCode, excludeId))
    .lean<SkuMasterRecord>()
    .exec();

export const listSkuMasters = async (options: SkuMasterListOptions): Promise<SkuMasterRecord[]> => {
  const direction: SortOrder = options.sortOrder === 'asc' ? 1 : -1;
  return SkuMasterModel.find(searchFilter(options.search))
    .sort({ [options.sortBy]: direction, _id: direction })
    .skip((options.page - 1) * options.limit)
    .limit(options.limit)
    .lean<SkuMasterRecord[]>()
    .exec();
};

export const countSkuMasters = async (search?: string): Promise<number> =>
  SkuMasterModel.countDocuments(searchFilter(search)).exec();

export const updateSkuMasterById = async (
  id: string,
  update: SkuMasterUpdate,
): Promise<SkuMasterRecord | null> => {
  const operation: UpdateQuery<SkuMasterPersistence> = { $set: update.set };
  if (update.unset.length > 0) {
    operation.$unset = Object.fromEntries(update.unset.map((field) => [field, 1]));
  }
  return SkuMasterModel.findByIdAndUpdate(id, operation, {
    new: true,
    runValidators: true,
  })
    .lean<SkuMasterRecord>()
    .exec();
};

export const deleteSkuMasterById = async (id: string): Promise<boolean> => {
  const result = await SkuMasterModel.deleteOne({ _id: id }).exec();
  return result.deletedCount === 1;
};
