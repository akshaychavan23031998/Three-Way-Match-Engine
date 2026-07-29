import { Schema } from 'mongoose';
export const itemSchema = new Schema(
  {
    itemCode: { type: String, required: true },
    normalizedItemCode: { type: String, required: true },
    description: { type: String, default: null },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, default: null },
    mrp: { type: Number, default: null },
    skuMaster: { type: Schema.Types.ObjectId, ref: 'SkuMaster', default: null },
  },
  { _id: false },
);
export const fileSchema = new Schema(
  {
    originalName: { type: String, required: true },
    storedName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    path: { type: String, required: true },
  },
  { _id: false },
);
