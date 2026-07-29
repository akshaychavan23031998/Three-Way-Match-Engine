import { Schema, type SchemaDefinition } from 'mongoose';

export interface DocumentMetadata {
  documentType: 'purchase_order' | 'grn' | 'invoice';
  originalFileName: string;
  storedFileName: string;
  mimeType: string;
  fileSize: number;
  filePath: string;
  uploadStatus: 'uploaded' | 'deleted';
  processingStatus: 'processing' | 'completed' | 'failed';
  parseProvider: 'gemini';
  parseModel: string;
  parseWarnings: string[];
  rawParsedData: unknown;
  uploadedBy: string;
  createdAt: Date;
  updatedAt: Date;
}
export const documentMetadataFields: SchemaDefinition = {
  documentType: {
    type: String,
    enum: ['purchase_order', 'grn', 'invoice'],
    required: true,
  },
  originalFileName: { type: String, required: true, trim: true },
  storedFileName: { type: String, required: true },
  mimeType: { type: String, required: true },
  fileSize: { type: Number, required: true, min: 0 },
  filePath: { type: String, required: true },
  uploadStatus: { type: String, enum: ['uploaded', 'deleted'], default: 'uploaded' },
  processingStatus: {
    type: String,
    enum: ['processing', 'completed', 'failed'],
    required: true,
  },
  parseProvider: { type: String, enum: ['gemini'], required: true },
  parseModel: { type: String, required: true },
  parseWarnings: { type: [String], default: [] },
  rawParsedData: { type: Schema.Types.Mixed, required: true },
  uploadedBy: { type: String, required: true },
};
export const optionalStringField = { type: String, trim: true, default: undefined };
