import { Schema, model } from 'mongoose';
import type { ParsedGrn } from '@three-way-match/shared';
import {
  documentMetadataFields,
  optionalStringField,
  type DocumentMetadata,
} from './document-fields.js';
export interface GrnPersistence extends ParsedGrn, DocumentMetadata {
  normalizedGrnNumber: string;
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
    receivedQuantity: { type: Number, required: true, min: Number.MIN_VALUE },
    acceptedQuantity: { type: Number, min: 0 },
    rejectedQuantity: { type: Number, min: 0 },
    mrp: { type: Number, min: 0 },
  },
  { _id: false, strict: 'throw' },
);
const schema = new Schema<GrnPersistence>(
  {
    ...documentMetadataFields,
    grnNumber: { type: String, required: true, trim: true },
    normalizedGrnNumber: { type: String, required: true },
    grnDate: { type: Date, required: true },
    poNumber: { type: String, required: true, trim: true },
    normalizedPoNumber: { type: String, required: true },
    supplierName: optionalStringField,
    supplierCode: optionalStringField,
    items: {
      type: [itemSchema],
      required: true,
      validate: [(v: unknown[]) => v.length > 0, 'Items required'],
    },
  },
  { timestamps: true, versionKey: false, strict: 'throw' },
);
schema.index({ normalizedGrnNumber: 1 });
schema.index({ normalizedPoNumber: 1 });
export const GrnModel = model<GrnPersistence>('Grn', schema);
