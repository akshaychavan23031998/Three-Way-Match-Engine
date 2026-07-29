import {
  MATCH_STATUSES,
  type MatchDocumentReference,
  type MatchItem,
  type MatchReason,
  type MatchStatus,
  type MatchTotals,
  type MatchTrigger,
} from '@three-way-match/shared';
import { Schema, model } from 'mongoose';

export interface MatchAuditPersistence {
  poNumber: string;
  normalizedPoNumber: string;
  status: MatchStatus;
  reasons: MatchReason[];
  items: MatchItem[];
  documentReferences: MatchDocumentReference[];
  totals: MatchTotals;
  computedAt: Date;
  computationVersion: '1.0';
  trigger: MatchTrigger;
  triggeredBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema(
  {
    poNumber: { type: String, required: true, trim: true },
    normalizedPoNumber: { type: String, required: true },
    status: { type: String, enum: MATCH_STATUSES, required: true },
    reasons: { type: [Schema.Types.Mixed], default: [] },
    items: { type: [Schema.Types.Mixed], default: [] },
    documentReferences: { type: [Schema.Types.Mixed], default: [] },
    totals: { type: Schema.Types.Mixed, required: true },
    computedAt: { type: Date, required: true },
    computationVersion: { type: String, enum: ['1.0'], required: true },
    trigger: {
      type: String,
      enum: ['document_upload', 'manual_recompute', 'api_request'],
      required: true,
    },
    triggeredBy: { type: String, required: true, trim: true },
  },
  { timestamps: true, versionKey: false, strict: 'throw' },
);
schema.index({ normalizedPoNumber: 1, computedAt: -1 });

export const MatchAuditModel = model<MatchAuditPersistence>('MatchAudit', schema);
