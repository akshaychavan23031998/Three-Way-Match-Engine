import { Schema, model } from 'mongoose';
import type { ParsedPurchaseOrder } from '@three-way-match/shared';
import {
  documentMetadataFields,
  optionalStringField,
  type DocumentMetadata,
} from './document-fields.js';
export interface PurchaseOrderPersistence extends ParsedPurchaseOrder, DocumentMetadata {
  normalizedPoNumber: string;
}
const itemSchema = new Schema(
  {
    lineNumber: { type: Number, min: 1 },
    skuErpCode: optionalStringField,
    eanCode: optionalStringField,
    description: { type: String, required: true, trim: true },
    hsnCode: optionalStringField,
    uom: optionalStringField,
    quantity: { type: Number, required: true, min: Number.MIN_VALUE },
    unitPrice: { type: Number, required: true, min: 0 },
    mrp: { type: Number, min: 0 },
    lineTotal: { type: Number, min: 0 },
  },
  { _id: false, strict: 'throw' },
);
const schema = new Schema<PurchaseOrderPersistence>(
  {
    ...documentMetadataFields,
    poNumber: { type: String, required: true, trim: true },
    normalizedPoNumber: { type: String, required: true },
    poDate: { type: Date, required: true },
    supplierName: optionalStringField,
    supplierCode: optionalStringField,
    currency: optionalStringField,
    items: {
      type: [itemSchema],
      required: true,
      validate: [(v: unknown[]) => v.length > 0, 'Items required'],
    },
    subtotal: { type: Number, min: 0 },
    taxAmount: { type: Number, min: 0 },
    totalAmount: { type: Number, min: 0 },
  },
  { timestamps: true, versionKey: false, strict: 'throw' },
);
schema.index({ normalizedPoNumber: 1 });
export const PurchaseOrderModel = model<PurchaseOrderPersistence>('PurchaseOrder', schema);
