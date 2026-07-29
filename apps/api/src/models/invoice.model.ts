import { Schema, model } from 'mongoose';
import { fileSchema, itemSchema } from './document-fields.js';
const schema = new Schema(
  {
    invoiceNumber: { type: String, required: true, index: true },
    normalizedInvoiceNumber: { type: String, required: true, index: true },
    poNumber: { type: String, required: true, index: true },
    normalizedPoNumber: { type: String, required: true, index: true },
    invoiceDate: { type: Date, default: null },
    items: { type: [itemSchema], default: [] },
    rawParsed: { type: Schema.Types.Mixed, required: true },
    file: { type: fileSchema, required: true },
    duplicateFlags: { type: [String], default: [] },
  },
  { timestamps: true },
);
export const InvoiceModel = model('Invoice', schema);
