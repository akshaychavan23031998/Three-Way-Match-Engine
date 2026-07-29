import { Types, type FilterQuery } from 'mongoose';
import type { DocumentListQuery, DocumentType } from '@three-way-match/shared';
import { GrnModel, type GrnPersistence } from '../models/grn.model.js';
import { InvoiceModel, type InvoicePersistence } from '../models/invoice.model.js';
import {
  PurchaseOrderModel,
  type PurchaseOrderPersistence,
} from '../models/purchase-order.model.js';
import { escapeRegExp } from '../utils/escape-reg-exp.js';

export type DocumentRecord =
  | ({ _id: Types.ObjectId } & PurchaseOrderPersistence)
  | ({ _id: Types.ObjectId } & GrnPersistence)
  | ({ _id: Types.ObjectId } & InvoicePersistence);
export interface LocatedDocument {
  documentType: DocumentType;
  document: DocumentRecord;
}
type New<T> = Omit<T, 'createdAt' | 'updatedAt'>;
export const createPurchaseOrder = async (
  value: New<PurchaseOrderPersistence>,
): Promise<DocumentRecord> => (await PurchaseOrderModel.create(value)).toObject() as DocumentRecord;
export const createGrn = async (value: New<GrnPersistence>): Promise<DocumentRecord> =>
  (await GrnModel.create(value)).toObject() as DocumentRecord;
export const createInvoice = async (value: New<InvoicePersistence>): Promise<DocumentRecord> =>
  (await InvoiceModel.create(value)).toObject() as DocumentRecord;

export const findDocumentById = async (id: string): Promise<LocatedDocument | null> => {
  const [po, grn, invoice] = await Promise.all([
    PurchaseOrderModel.findById(id).lean().exec(),
    GrnModel.findById(id).lean().exec(),
    InvoiceModel.findById(id).lean().exec(),
  ]);
  if (po) return { documentType: 'purchase_order', document: po as DocumentRecord };
  if (grn) return { documentType: 'grn', document: grn as DocumentRecord };
  if (invoice) return { documentType: 'invoice', document: invoice as DocumentRecord };
  return null;
};
const filterFor = (type: DocumentType, search?: string): FilterQuery<DocumentRecord> => {
  if (!search) return {};
  const regex = new RegExp(escapeRegExp(search), 'i');
  const common = [{ originalFileName: regex }, { supplierName: regex }, { poNumber: regex }];
  if (type === 'purchase_order') return { $or: common };
  if (type === 'grn') return { $or: [...common, { grnNumber: regex }] };
  return { $or: [...common, { invoiceNumber: regex }] };
};
export const listDocuments = async (query: DocumentListQuery): Promise<DocumentRecord[]> => {
  const groups: DocumentRecord[][] = [];
  if (!query.documentType || query.documentType === 'purchase_order')
    groups.push(
      (await PurchaseOrderModel.find(filterFor('purchase_order', query.search))
        .limit(1000)
        .lean()
        .exec()) as DocumentRecord[],
    );
  if (!query.documentType || query.documentType === 'grn')
    groups.push(
      (await GrnModel.find(filterFor('grn', query.search))
        .limit(1000)
        .lean()
        .exec()) as DocumentRecord[],
    );
  if (!query.documentType || query.documentType === 'invoice')
    groups.push(
      (await InvoiceModel.find(filterFor('invoice', query.search))
        .limit(1000)
        .lean()
        .exec()) as DocumentRecord[],
    );
  const direction = query.sortOrder === 'asc' ? 1 : -1;
  const field = (record: DocumentRecord): string | Date => {
    if (query.sortBy === 'documentDate')
      return 'poDate' in record
        ? record.poDate
        : 'grnDate' in record
          ? record.grnDate
          : record.invoiceDate;
    if (query.sortBy === 'originalFileName') return record.originalFileName;
    if (query.sortBy === 'updatedAt') return record.updatedAt;
    return record.createdAt;
  };
  return groups
    .flat()
    .sort((a, b) => {
      const first = field(a),
        second = field(b);
      const comparison =
        first instanceof Date && second instanceof Date
          ? first.getTime() - second.getTime()
          : String(first).localeCompare(String(second));
      return comparison * direction;
    })
    .slice((query.page - 1) * query.limit, query.page * query.limit);
};
export const countDocuments = async (query: DocumentListQuery): Promise<number> => {
  const counts: number[] = [];
  if (!query.documentType || query.documentType === 'purchase_order')
    counts.push(await PurchaseOrderModel.countDocuments(filterFor('purchase_order', query.search)));
  if (!query.documentType || query.documentType === 'grn')
    counts.push(await GrnModel.countDocuments(filterFor('grn', query.search)));
  if (!query.documentType || query.documentType === 'invoice')
    counts.push(await InvoiceModel.countDocuments(filterFor('invoice', query.search)));
  return counts.reduce((sum, count) => sum + count, 0);
};
export const deleteDocumentById = async (located: LocatedDocument): Promise<boolean> => {
  if (located.documentType === 'purchase_order')
    return (await PurchaseOrderModel.deleteOne({ _id: located.document._id })).deletedCount === 1;
  if (located.documentType === 'grn')
    return (await GrnModel.deleteOne({ _id: located.document._id })).deletedCount === 1;
  return (await InvoiceModel.deleteOne({ _id: located.document._id })).deletedCount === 1;
};
export const findPurchaseOrdersByNormalizedPoNumber = (value: string) =>
  PurchaseOrderModel.find({ normalizedPoNumber: value })
    .sort({ createdAt: 1, _id: 1 })
    .lean()
    .exec();
/** @deprecated Use findPurchaseOrdersByNormalizedPoNumber. */
export const findPurchaseOrderByNormalizedPoNumber = (value: string) =>
  PurchaseOrderModel.findOne({ normalizedPoNumber: value }).lean().exec();
export const findGrnsByNormalizedPoNumber = (value: string) =>
  GrnModel.find({ normalizedPoNumber: value }).sort({ createdAt: 1, _id: 1 }).lean().exec();
export const findInvoicesByNormalizedPoNumber = (value: string) =>
  InvoiceModel.find({ normalizedPoNumber: value }).sort({ createdAt: 1, _id: 1 }).lean().exec();
