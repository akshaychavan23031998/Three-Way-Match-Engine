import { Schema, model } from 'mongoose';
const schema = new Schema(
  {
    poNumber: { type: String, required: true, index: true },
    normalizedPoNumber: { type: String, required: true, index: true },
    documentId: { type: Schema.Types.ObjectId, required: true },
    documentType: { type: String, enum: ['po', 'grn', 'invoice'], required: true },
    steps: { type: [Schema.Types.Mixed], default: [] },
  },
  { timestamps: true },
);
export const MatchAuditModel = model('MatchAudit', schema);
