import { Schema, model } from 'mongoose';
import { fileSchema, itemSchema } from './document-fields.js';
const schema = new Schema(
  {
    poNumber: { type: String, required: true, index: true },
    normalizedPoNumber: { type: String, required: true, index: true },
    poDate: { type: Date, default: null },
    vendorName: { type: String, default: null },
    items: { type: [itemSchema], default: [] },
    rawParsed: { type: Schema.Types.Mixed, required: true },
    file: { type: fileSchema, required: true },
    duplicateFlags: { type: [String], default: [] },
  },
  { timestamps: true },
);
export const PurchaseOrderModel = model('PurchaseOrder', schema);
