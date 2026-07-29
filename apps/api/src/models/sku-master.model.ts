import { Schema, model, type HydratedDocument, type Model } from 'mongoose';

export interface SkuMasterPersistence {
  skuErpCode: string;
  normalizedSkuErpCode: string;
  name: string;
  eanCode?: string;
  normalizedEanCode?: string;
  hsnCode?: string;
  uom?: string;
  agreedRate?: number;
  mrp?: number;
  priceTolerance: number;
  createdAt: Date;
  updatedAt: Date;
}

export type SkuMasterDocument = HydratedDocument<SkuMasterPersistence>;

const schema = new Schema<SkuMasterPersistence, Model<SkuMasterPersistence>>(
  {
    skuErpCode: { type: String, required: true, trim: true },
    normalizedSkuErpCode: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    eanCode: { type: String, trim: true },
    normalizedEanCode: { type: String, trim: true },
    hsnCode: { type: String, trim: true },
    uom: { type: String, trim: true },
    agreedRate: { type: Number, min: 0 },
    mrp: { type: Number, min: 0 },
    priceTolerance: { type: Number, required: true, default: 0.05, min: 0, max: 1 },
  },
  {
    timestamps: true,
    versionKey: false,
    strict: 'throw',
  },
);

schema.index({ normalizedSkuErpCode: 1 }, { unique: true });
schema.index(
  { normalizedEanCode: 1 },
  {
    unique: true,
    partialFilterExpression: { normalizedEanCode: { $type: 'string' } },
  },
);

export const SkuMasterModel = model<SkuMasterPersistence>('SkuMaster', schema);
