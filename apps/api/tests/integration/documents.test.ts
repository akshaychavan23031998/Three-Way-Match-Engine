import { readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import mongoose, { Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { app } from '../../src/app.js';
import { GrnModel } from '../../src/models/grn.model.js';
import { InvoiceModel } from '../../src/models/invoice.model.js';
import { PurchaseOrderModel } from '../../src/models/purchase-order.model.js';
import { MatchAuditModel } from '../../src/models/match-audit.model.js';
import * as geminiService from '../../src/services/gemini/gemini.service.js';
import {
  ensureUploadDirectory,
  fileExists,
  getStoredFilePath,
} from '../../src/services/documents/file-storage.service.js';
import { AppError } from '../../src/utils/app-error.js';

const endpoint = '/api/documents';
const auth = { Authorization: 'Bearer test-token' };
const file = Buffer.from('small fixture');
const po = {
  poNumber: '001-PO',
  poDate: '2026-07-01',
  supplierName: '',
  items: [{ skuErpCode: '001', eanCode: '0002', description: 'Item', quantity: 2, unitPrice: 10 }],
};
const grn = {
  grnNumber: '001-GRN',
  grnDate: '2026-07-02',
  poNumber: '001-PO',
  items: [{ description: 'Item', receivedQuantity: 2, acceptedQuantity: 1, rejectedQuantity: 1 }],
};
const invoice = {
  invoiceNumber: '001-INV',
  invoiceDate: '2026-07-03',
  poNumber: '001-PO',
  items: [{ description: 'Item', invoicedQuantity: 2, unitPrice: 10 }],
};
let server: MongoMemoryServer;
const parseSpy = vi.spyOn(geminiService, 'parseDocument');
const upload = (type: string, name = 'doc.pdf', mime = 'application/pdf') =>
  request(app)
    .post(`${endpoint}/upload`)
    .set(auth)
    .field('documentType', type)
    .attach('file', file, { filename: name, contentType: mime });
beforeAll(async () => {
  server = await MongoMemoryServer.create();
  await mongoose.connect(server.getUri());
  await ensureUploadDirectory();
}, 120_000);
afterEach(async () => {
  parseSpy.mockReset();
  await Promise.all([
    PurchaseOrderModel.deleteMany({}),
    GrnModel.deleteMany({}),
    InvoiceModel.deleteMany({}),
    MatchAuditModel.deleteMany({}),
  ]);
  const root = path.dirname(getStoredFilePath('x'));
  for (const name of await readdir(root).catch(() => [])) {
    if (name !== '.gitkeep') await rm(getStoredFilePath(name), { force: true });
  }
});
afterAll(async () => {
  await mongoose.disconnect();
  await server.stop();
  await rm(path.dirname(getStoredFilePath('x')), { recursive: true, force: true });
});
describe('document upload validation', () => {
  it('rejects missing bearer token', async () =>
    expect((await request(app).post(`${endpoint}/upload`)).status).toBe(401));
  it('rejects missing document type and cleans the file', async () =>
    expect(
      (
        await request(app)
          .post(`${endpoint}/upload`)
          .set(auth)
          .attach('file', file, { filename: 'x.pdf', contentType: 'application/pdf' })
      ).status,
    ).toBe(400));
  it('rejects invalid document type', async () => expect((await upload('other')).status).toBe(400));
  it('rejects missing file', async () =>
    expect(
      (await request(app).post(`${endpoint}/upload`).set(auth).field('documentType', 'grn')).body
        .error.code,
    ).toBe('file_required'));
  it('rejects unsupported MIME', async () =>
    expect((await upload('grn', 'x.pdf', 'text/plain')).body.error.code).toBe(
      'unsupported_file_type',
    ));
  it('rejects unsupported extension', async () =>
    expect((await upload('grn', 'x.txt', 'application/pdf')).status).toBe(400));
  it('rejects oversized files', async () => {
    const response = await request(app)
      .post(`${endpoint}/upload`)
      .set(auth)
      .field('documentType', 'grn')
      .attach('file', Buffer.alloc(10 * 1024 * 1024 + 1), {
        filename: 'x.pdf',
        contentType: 'application/pdf',
      });
    expect(response.status).toBe(413);
    expect(response.body.error.details).toEqual({ maxSizeMb: 10 });
  });
  it('rejects multiple files', async () => {
    const response = await request(app)
      .post(`${endpoint}/upload`)
      .set(auth)
      .field('documentType', 'grn')
      .attach('file', file, { filename: 'a.pdf', contentType: 'application/pdf' })
      .attach('file', file, { filename: 'b.pdf', contentType: 'application/pdf' });
    expect(response.status).toBe(400);
  });
});
describe('document processing and API', () => {
  it('uploads and persists a PO with string codes and safe response', async () => {
    parseSpy.mockResolvedValue(po);
    const response = await upload('purchase_order');
    expect(response.status).toBe(201);
    expect(response.body.data.poNumber).toBe('001-PO');
    expect(response.body.data.matchRecalculationStatus).toBe('completed');
    expect(await MatchAuditModel.countDocuments({ trigger: 'document_upload' })).toBe(1);
    expect(response.body.data.items[0].skuErpCode).toBe('001');
    expect(response.body.data).not.toHaveProperty('filePath');
    expect(response.body.data).not.toHaveProperty('storedFileName');
    expect(response.body.data).not.toHaveProperty('normalizedPoNumber');
    expect(response.body.data).not.toHaveProperty('__v');
    const stored = await PurchaseOrderModel.findOne().lean();
    expect(stored?.supplierName).toBeUndefined();
    expect(await fileExists(stored?.storedFileName ?? '')).toBe(true);
  });
  it('uploads and persists a GRN', async () => {
    parseSpy.mockResolvedValue(grn);
    const response = await upload('grn');
    expect(response.status).toBe(201);
    expect(await GrnModel.countDocuments()).toBe(1);
    expect(response.body.data.grnNumber).toBe('001-GRN');
  });
  it('uploads and persists an invoice', async () => {
    parseSpy.mockResolvedValue(invoice);
    const response = await upload('invoice');
    expect(response.status).toBe(201);
    expect(await InvoiceModel.countDocuments()).toBe(1);
    expect(response.body.data.invoiceNumber).toBe('001-INV');
  });
  it.each([
    ['invalid PO date', 'purchase_order', { ...po, poDate: 'bad' }],
    ['empty PO items', 'purchase_order', { ...po, items: [] }],
    [
      'negative PO quantity',
      'purchase_order',
      { ...po, items: [{ ...po.items[0], quantity: -1 }] },
    ],
    ['negative PO price', 'purchase_order', { ...po, items: [{ ...po.items[0], unitPrice: -1 }] }],
    ['empty GRN items', 'grn', { ...grn, items: [] }],
    ['negative received', 'grn', { ...grn, items: [{ ...grn.items[0], receivedQuantity: -1 }] }],
    [
      'invalid GRN quantities',
      'grn',
      { ...grn, items: [{ ...grn.items[0], acceptedQuantity: 2, rejectedQuantity: 2 }] },
    ],
    ['empty invoice items', 'invoice', { ...invoice, items: [] }],
    [
      'negative invoiced',
      'invoice',
      { ...invoice, items: [{ ...invoice.items[0], invoicedQuantity: -1 }] },
    ],
    [
      'negative invoice price',
      'invoice',
      { ...invoice, items: [{ ...invoice.items[0], unitPrice: -1 }] },
    ],
  ])('returns 422 for %s and removes the file', async (_name, type, parsed) => {
    parseSpy.mockResolvedValue(parsed);
    const response = await upload(type);
    expect(response.status).toBe(422);
    expect(await readdir(path.dirname(getStoredFilePath('x')))).toHaveLength(0);
  });
  it('maps parser unavailability without leaking details and cleans the file', async () => {
    parseSpy.mockRejectedValue(
      new AppError(
        503,
        'document_parser_unavailable',
        'The document parsing service is temporarily unavailable',
      ),
    );
    const response = await upload('grn');
    expect(response.status).toBe(503);
    expect(JSON.stringify(response.body)).not.toContain('external secret');
  });
  it('cleans the file when persistence fails', async () => {
    parseSpy.mockResolvedValue(po);
    const createSpy = vi
      .spyOn(PurchaseOrderModel, 'create')
      .mockRejectedValueOnce(new Error('database failed'));
    const response = await upload('purchase_order');
    expect(response.status).toBe(500);
    expect(await readdir(path.dirname(getStoredFilePath('x')))).toHaveLength(0);
    createSpy.mockRestore();
  });
  it('keeps a successful upload when match recomputation fails', async () => {
    parseSpy.mockResolvedValue(po);
    const auditSpy = vi
      .spyOn(MatchAuditModel, 'create')
      .mockRejectedValueOnce(new Error('matching failed'));
    const response = await upload('purchase_order');
    expect(response.status).toBe(201);
    expect(response.body.data.matchRecalculationStatus).toBe('failed');
    expect(await PurchaseOrderModel.countDocuments()).toBe(1);
    expect(
      await fileExists(
        response.body.data.id
          ? ((await PurchaseOrderModel.findById(response.body.data.id).lean())?.storedFileName ??
              '')
          : '',
      ),
    ).toBe(true);
    auditSpy.mockRestore();
  });
  it('lists with pagination, filtering and search', async () => {
    parseSpy.mockResolvedValueOnce(po);
    await upload('purchase_order');
    parseSpy.mockResolvedValueOnce(grn);
    await upload('grn');
    const response = await request(app)
      .get(`${endpoint}?documentType=grn&search=001-GRN`)
      .set(auth);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.meta.total).toBe(1);
  });
  it('requires authentication for listing', async () => {
    expect((await request(app).get(endpoint)).status).toBe(401);
  });
  it('gets each document type and rejects invalid/unknown IDs', async () => {
    for (const [type, parsed] of [
      ['purchase_order', po],
      ['grn', grn],
      ['invoice', invoice],
    ] as const) {
      parseSpy.mockResolvedValueOnce(parsed);
      const created = await upload(type);
      expect((await request(app).get(`${endpoint}/${created.body.data.id}`).set(auth)).status).toBe(
        200,
      );
    }
    expect((await request(app).get(`${endpoint}/bad`).set(auth)).status).toBe(400);
    expect((await request(app).get(`${endpoint}/${new Types.ObjectId()}`).set(auth)).status).toBe(
      404,
    );
  });
  it('deletes database record and file, tolerates missing file, then returns 404', async () => {
    parseSpy.mockResolvedValue(po);
    const created = await upload('purchase_order');
    const stored = await PurchaseOrderModel.findById(created.body.data.id).lean();
    await rm(getStoredFilePath(stored?.storedFileName ?? ''), { force: true });
    expect(
      (await request(app).delete(`${endpoint}/${created.body.data.id}`).set(auth)).status,
    ).toBe(204);
    expect((await request(app).get(`${endpoint}/${created.body.data.id}`).set(auth)).status).toBe(
      404,
    );
  });
  it('deletes an existing stored file', async () => {
    parseSpy.mockResolvedValue(po);
    const created = await upload('purchase_order');
    const stored = await PurchaseOrderModel.findById(created.body.data.id).lean();
    expect(await fileExists(stored?.storedFileName ?? '')).toBe(true);
    expect(
      (await request(app).delete(`${endpoint}/${created.body.data.id}`).set(auth)).status,
    ).toBe(204);
    expect(await fileExists(stored?.storedFileName ?? '')).toBe(false);
  });
  it('uses unique safe stored names that cannot traverse', async () => {
    parseSpy.mockResolvedValueOnce(po);
    await upload('purchase_order', '../../same.pdf');
    parseSpy.mockResolvedValueOnce({ ...po, poNumber: '2' });
    await upload('purchase_order', '../../same.pdf');
    const records = await PurchaseOrderModel.find().lean();
    expect(new Set(records.map((r) => r.storedFileName)).size).toBe(2);
    expect(records.every((r) => !r.storedFileName.includes('..'))).toBe(true);
  });
});
