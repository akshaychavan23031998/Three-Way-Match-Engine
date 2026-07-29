import { Types } from 'mongoose';
import { MatchAuditModel, type MatchAuditPersistence } from '../models/match-audit.model.js';

export interface MatchAuditRecord extends MatchAuditPersistence {
  _id: Types.ObjectId;
}
type NewAudit = Omit<MatchAuditPersistence, 'createdAt' | 'updatedAt'>;

export const createMatchAudit = async (value: NewAudit): Promise<MatchAuditRecord> =>
  (await MatchAuditModel.create(value)).toObject() as MatchAuditRecord;

export const findLatestMatchByNormalizedPoNumber = (
  normalizedPoNumber: string,
): Promise<MatchAuditRecord | null> =>
  MatchAuditModel.findOne({ normalizedPoNumber })
    .sort({ computedAt: -1, _id: -1 })
    .lean<MatchAuditRecord>()
    .exec();

export const listMatchAuditsByNormalizedPoNumber = (
  normalizedPoNumber: string,
  page: number,
  limit: number,
): Promise<MatchAuditRecord[]> =>
  MatchAuditModel.find({ normalizedPoNumber })
    .sort({ computedAt: -1, _id: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean<MatchAuditRecord[]>()
    .exec();

export const countMatchAuditsByNormalizedPoNumber = (normalizedPoNumber: string): Promise<number> =>
  MatchAuditModel.countDocuments({ normalizedPoNumber }).exec();

export const findMatchAuditById = (id: string): Promise<MatchAuditRecord | null> =>
  MatchAuditModel.findById(id).lean<MatchAuditRecord>().exec();

export class MatchAuditRepository {}
