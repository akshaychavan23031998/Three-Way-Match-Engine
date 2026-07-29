import { Schema, model } from 'mongoose';
const schema = new Schema(
  {
    skuErpCode: { type: String, required: true },
    normalizedSkuErpCode: { type: String, required: true, index: true },
    name: { type: String, required: true },
    eanCode: { type: String, required: true },
    normalizedEanCode: { type: String, required: true, index: true },
    hsnCode: { type: String, required: true },
    uom: { type: String, required: true },
    agreedRate: { type: Number, required: true },
    mrp: { type: Number, required: true },
    priceTolerance: { type: Number, required: true, default: 0 },
  },
  { timestamps: true },
);
export const SkuMasterModel = model('SkuMaster', schema);
