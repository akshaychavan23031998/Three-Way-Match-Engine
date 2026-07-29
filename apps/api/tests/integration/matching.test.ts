import mongoose, { Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { app } from '../../src/app.js';
import { GrnModel } from '../../src/models/grn.model.js';
import { InvoiceModel } from '../../src/models/invoice.model.js';
import { MatchAuditModel } from '../../src/models/match-audit.model.js';
import { PurchaseOrderModel } from '../../src/models/purchase-order.model.js';
import { SkuMasterModel } from '../../src/models/sku-master.model.js';

const auth = { Authorization: 'Bearer test-token' };
const metadata = (type: 'purchase_order' | 'grn' | 'invoice') => ({
  documentType: type,
  originalFileName: `${type}.pdf`,
  storedFileName: `${type}.pdf`,
  mimeType: 'application/pdf',
  fileSize: 100,
  filePath: 'secret/file/path',
  uploadStatus: 'uploaded' as const,
  processingStatus: 'completed' as const,
  parseProvider: 'gemini' as const,
  parseModel: 'test',
  parseWarnings: [],
  rawParsedData: { secret: 'raw' },
  uploadedBy: 'admin@example.com',
});
const createSku = () =>
  SkuMasterModel.create({
    skuErpCode: 'SKU-1',
    normalizedSkuErpCode: 'sku-1',
    eanCode: 'EAN-1',
    normalizedEanCode: 'ean-1',
    name: 'Mapped item',
    agreedRate: 100,
    mrp: 150,
    priceTolerance: 0.05,
  });
const createPo = (overrides: Record<string, unknown> = {}) =>
  PurchaseOrderModel.create({
    ...metadata('purchase_order'),
    poNumber: 'PO-1',
    normalizedPoNumber: 'po-1',
    poDate: new Date('2026-01-01'),
    supplierName: 'Supplier One',
    items: [
      {
        skuErpCode: 'SKU-1',
        eanCode: 'EAN-1',
        description: 'Item',
        quantity: 10,
        unitPrice: 100,
        mrp: 150,
      },
    ],
    ...overrides,
  });
const createGrn = (overrides: Record<string, unknown> = {}) =>
  GrnModel.create({
    ...metadata('grn'),
    grnNumber: 'GRN-1',
    normalizedGrnNumber: 'grn-1',
    poNumber: 'PO-1',
    normalizedPoNumber: 'po-1',
    grnDate: new Date('2026-01-02'),
    items: [
      {
        skuErpCode: 'SKU-1',
        eanCode: 'EAN-1',
        description: 'Item',
        receivedQuantity: 10,
        acceptedQuantity: 10,
        rejectedQuantity: 0,
        mrp: 150,
      },
    ],
    ...overrides,
  });
const createInvoice = (overrides: Record<string, unknown> = {}) =>
  InvoiceModel.create({
    ...metadata('invoice'),
    invoiceNumber: 'INV-1',
    normalizedInvoiceNumber: 'inv-1',
    poNumber: 'PO-1',
    normalizedPoNumber: 'po-1',
    invoiceDate: new Date('2026-01-03'),
    items: [
      {
        skuErpCode: 'SKU-1',
        eanCode: 'EAN-1',
        description: 'Item',
        invoicedQuantity: 10,
        unitPrice: 100,
        mrp: 150,
      },
    ],
    ...overrides,
  });

let server: MongoMemoryServer;
beforeAll(async () => {
  server = await MongoMemoryServer.create();
  await mongoose.connect(server.getUri());
}, 120_000);
afterEach(async () => {
  await Promise.all([
    PurchaseOrderModel.deleteMany({}),
    GrnModel.deleteMany({}),
    InvoiceModel.deleteMany({}),
    MatchAuditModel.deleteMany({}),
    SkuMasterModel.deleteMany({}),
  ]);
});
afterAll(async () => {
  await mongoose.disconnect();
  await server.stop();
});

describe('match APIs', () => {
  it('requires authentication', async () => {
    expect((await request(app).get('/api/matches/PO-1')).status).toBe(401);
    expect((await request(app).post('/api/matches/PO-1/recompute')).status).toBe(401);
  });
  it('computes and persists when no audit exists', async () => {
    await createPo();
    const response = await request(app).get('/api/matches/PO-1').set(auth);
    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe('mismatched');
    expect(response.body.data.trigger).toBe('api_request');
    expect(await MatchAuditModel.countDocuments()).toBe(1);
  });
  it('returns the latest audit without recomputing', async () => {
    await createPo();
    const first = await request(app).get('/api/matches/PO-1').set(auth);
    const second = await request(app).get('/api/matches/PO-1').set(auth);
    expect(second.body.data.id).toBe(first.body.data.id);
    expect(await MatchAuditModel.countDocuments()).toBe(1);
  });
  it('recomputes, paginates history newest first, and gets audit by ID', async () => {
    await Promise.all([createSku(), createPo(), createGrn(), createInvoice()]);
    const first = await request(app).post('/api/matches/PO-1/recompute').set(auth);
    const second = await request(app).post('/api/matches/PO-1/recompute').set(auth);
    expect(second.body.data.status).toBe('matched');
    const history = await request(app).get('/api/matches/PO-1/history?page=1&limit=1').set(auth);
    expect(history.body.meta).toMatchObject({ page: 1, limit: 1, total: 2, totalPages: 2 });
    expect(history.body.data[0].id).toBe(second.body.data.id);
    const audit = await request(app).get(`/api/matches/audits/${first.body.data.id}`).set(auth);
    expect(audit.status).toBe(200);
  });
  it('validates and reports missing audit IDs', async () => {
    expect((await request(app).get('/api/matches/audits/bad').set(auth)).body.error.code).toBe(
      'invalid_resource_id',
    );
    expect(
      (await request(app).get(`/api/matches/audits/${new Types.ObjectId()}`).set(auth)).body.error
        .code,
    ).toBe('match_audit_not_found');
  });
  it.each([
    ['PO only', async () => createPo(), ['missing_grn_item', 'missing_invoice_item']],
    ['PO and GRN', async () => Promise.all([createPo(), createGrn()]), ['missing_invoice_item']],
    [
      'PO and invoice',
      async () => Promise.all([createPo(), createInvoice()]),
      ['missing_grn_item'],
    ],
  ])('handles %s document state', async (_name, arrange, codes) => {
    await createSku();
    await arrange();
    const response = await request(app).post('/api/matches/PO-1/recompute').set(auth);
    expect(response.body.data.reasons.map(({ code }: { code: string }) => code)).toEqual(
      expect.arrayContaining(codes),
    );
  });
  it('produces a complete valid match and safe public serialization', async () => {
    await Promise.all([createSku(), createPo(), createGrn(), createInvoice()]);
    const response = await request(app).post('/api/matches/PO-1/recompute').set(auth);
    expect(response.body.data.status).toBe('matched');
    expect(response.body.data.totals).toMatchObject({
      orderedQuantity: 10,
      acceptedQuantity: 10,
      invoicedQuantity: 10,
      poAmount: 1000,
      invoiceAmount: 1000,
    });
    const body = JSON.stringify(response.body);
    for (const forbidden of [
      'normalizedPoNumber',
      'normalizedSkuErpCode',
      'filePath',
      'storedFileName',
      'rawParsedData',
      '__v',
    ])
      expect(body).not.toContain(forbidden);
  });
  it.each([
    [
      'GRN quantity',
      () =>
        createGrn({ items: [{ skuErpCode: 'SKU-1', description: 'Item', receivedQuantity: 9 }] }),
      'grn_quantity_mismatch',
    ],
    [
      'invoice quantity',
      () =>
        createInvoice({
          items: [
            { skuErpCode: 'SKU-1', description: 'Item', invoicedQuantity: 11, unitPrice: 100 },
          ],
        }),
      'invoice_quantity_mismatch',
    ],
    [
      'price',
      () =>
        createInvoice({
          items: [
            { skuErpCode: 'SKU-1', description: 'Item', invoicedQuantity: 10, unitPrice: 106 },
          ],
        }),
      'price_mismatch',
    ],
    [
      'MRP',
      () =>
        createInvoice({
          items: [
            {
              skuErpCode: 'SKU-1',
              description: 'Item',
              invoicedQuantity: 10,
              unitPrice: 100,
              mrp: 151,
            },
          ],
        }),
      'mrp_mismatch',
    ],
    [
      'invoice date',
      () => createInvoice({ invoiceDate: new Date('2025-12-31') }),
      'invoice_before_po',
    ],
  ])('detects %s mismatch', async (_name, createProblemInvoiceOrGrn, code) => {
    await Promise.all([createSku(), createPo()]);
    if (code === 'grn_quantity_mismatch') {
      await Promise.all([createProblemInvoiceOrGrn(), createInvoice()]);
    } else {
      await Promise.all([createGrn(), createProblemInvoiceOrGrn()]);
    }
    const response = await request(app).post('/api/matches/PO-1/recompute').set(auth);
    expect(response.body.data.status).toBe('mismatched');
    expect(response.body.data.reasons.map(({ code: value }: { code: string }) => value)).toContain(
      code,
    );
  });
  it('aggregates multiple distinct GRNs and invoices', async () => {
    await Promise.all([
      createSku(),
      createPo(),
      createGrn({
        items: [{ skuErpCode: 'SKU-1', description: 'Item', receivedQuantity: 5 }],
      }),
      createGrn({
        grnNumber: 'GRN-2',
        normalizedGrnNumber: 'grn-2',
        items: [{ skuErpCode: 'SKU-1', description: 'Item', receivedQuantity: 5 }],
      }),
      createInvoice({
        items: [{ skuErpCode: 'SKU-1', description: 'Item', invoicedQuantity: 5, unitPrice: 100 }],
      }),
      createInvoice({
        invoiceNumber: 'INV-2',
        normalizedInvoiceNumber: 'inv-2',
        items: [{ skuErpCode: 'SKU-1', description: 'Item', invoicedQuantity: 5, unitPrice: 100 }],
      }),
    ]);
    const response = await request(app).post('/api/matches/PO-1/recompute').set(auth);
    expect(response.body.data.totals).toMatchObject({
      receivedQuantity: 10,
      invoicedQuantity: 10,
    });
    expect(response.body.data.reasons).toEqual([]);
  });
  it('detects items missing from the PO and unresolved SKU codes', async () => {
    await Promise.all([
      createGrn({
        items: [{ skuErpCode: 'UNKNOWN', description: 'Unknown', receivedQuantity: 1 }],
      }),
      createInvoice({
        items: [
          {
            skuErpCode: 'UNKNOWN',
            description: 'Unknown',
            invoicedQuantity: 1,
            unitPrice: 1,
          },
        ],
      }),
    ]);
    const response = await request(app).post('/api/matches/PO-1/recompute').set(auth);
    const codes = response.body.data.reasons.map(({ code }: { code: string }) => code);
    expect(codes).toEqual(expect.arrayContaining(['missing_po_item', 'unmapped_sku']));
  });
  it('detects an ERP/EAN mapping conflict', async () => {
    await Promise.all([
      createSku(),
      SkuMasterModel.create({
        skuErpCode: 'SKU-2',
        normalizedSkuErpCode: 'sku-2',
        eanCode: 'EAN-2',
        normalizedEanCode: 'ean-2',
        name: 'Other item',
        priceTolerance: 0.05,
      }),
      createPo({
        items: [
          {
            skuErpCode: 'SKU-1',
            eanCode: 'EAN-2',
            description: 'Conflicting item',
            quantity: 1,
            unitPrice: 100,
          },
        ],
      }),
    ]);
    const response = await request(app).post('/api/matches/PO-1/recompute').set(auth);
    expect(response.body.data.reasons.map(({ code }: { code: string }) => code)).toContain(
      'sku_mapping_conflict',
    );
  });
  it.each([
    ['duplicate PO', async () => createPo(), 'duplicate_purchase_order'],
    [
      'duplicate GRN',
      async () => createGrn({ storedFileName: 'duplicate-grn.pdf' }),
      'duplicate_grn',
    ],
    [
      'duplicate invoice',
      async () => createInvoice({ storedFileName: 'duplicate-invoice.pdf' }),
      'duplicate_invoice',
    ],
  ])('detects %s', async (_name, duplicate, code) => {
    await Promise.all([createSku(), createPo(), createGrn(), createInvoice()]);
    await duplicate();
    const response = await request(app).post('/api/matches/PO-1/recompute').set(auth);
    expect(response.body.data.reasons.map(({ code: value }: { code: string }) => value)).toContain(
      code,
    );
  });
});

describe('summary API', () => {
  it('requires authentication and does not trigger recomputation', async () => {
    await createPo();
    expect((await request(app).get('/api/summary')).status).toBe(401);
    expect((await request(app).get('/api/summary').set(auth)).status).toBe(200);
    expect(await MatchAuditModel.countDocuments()).toBe(0);
  });
  it('lists one row per PO with counts, search, filtering, sorting, and pagination', async () => {
    await Promise.all([createSku(), createPo(), createGrn(), createInvoice()]);
    const match = await request(app).post('/api/matches/PO-1/recompute').set(auth);
    const response = await request(app)
      .get('/api/summary?search=Supplier&status=matched&page=1&limit=1&sortBy=invoiceAmount')
      .set(auth);
    expect(response.body.meta).toMatchObject({ page: 1, limit: 1, total: 1 });
    expect(response.body.data[0]).toMatchObject({
      poNumber: 'PO-1',
      latestMatchAuditId: match.body.data.id,
      status: 'matched',
      purchaseOrderCount: 1,
      grnCount: 1,
      invoiceCount: 1,
    });
  });
});
