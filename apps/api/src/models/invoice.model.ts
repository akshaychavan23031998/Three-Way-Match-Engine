import { Schema, model } from 'mongoose';
import type { ParsedInvoice } from '@three-way-match/shared';
import {
  documentMetadataFields,
  optionalStringField,
  type DocumentMetadata,
} from './document-fields.js';
export interface InvoicePersistence extends ParsedInvoice, DocumentMetadata {
  normalizedInvoiceNumber: string;
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
    invoicedQuantity: { type: Number, required: true, min: Number.MIN_VALUE },
    unitPrice: { type: Number, required: true, min: 0 },
    mrp: { type: Number, min: 0 },
    lineTotal: { type: Number, min: 0 },
  },
  { _id: false, strict: 'throw' },
);
const schema = new Schema<InvoicePersistence>(
  {
    ...documentMetadataFields,
    invoiceNumber: { type: String, required: true, trim: true },
    normalizedInvoiceNumber: { type: String, required: true },
    invoiceDate: { type: Date, required: true },
    poNumber: { type: String, required: true, trim: true },
    normalizedPoNumber: { type: String, required: true },
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
schema.index({ normalizedInvoiceNumber: 1 });
schema.index({ normalizedPoNumber: 1 });
export const InvoiceModel = model<InvoicePersistence>('Invoice', schema);
