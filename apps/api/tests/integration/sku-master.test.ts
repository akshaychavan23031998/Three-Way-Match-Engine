import mongoose, { Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { SKU_MASTER_SEED_DATA, seedSkuMaster } from '../../scripts/seed-sku-master.js';
import { app } from '../../src/app.js';
import { SkuMasterModel } from '../../src/models/sku-master.model.js';

const token = 'test-token';
const auth = { Authorization: `Bearer ${token}` };
const endpoint = '/api/masters/sku';
const baseSku = {
  skuErpCode: '11423',
  eanCode: 'FG-P-F-0503',
  name: 'PSM Cheesy Spicy Vegetable Momos 24Pcs',
  hsnCode: '19022010',
  uom: 'PKT',
  agreedRate: 220.76,
  mrp: 305,
  priceTolerance: 0.05,
};

let mongoServer: MongoMemoryServer | undefined;

const createSku = async (overrides: Record<string, unknown> = {}) =>
  request(app)
    .post(endpoint)
    .set(auth)
    .send({ ...baseSku, ...overrides });

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  await SkuMasterModel.syncIndexes();
}, 600_000);

afterEach(async () => {
  await SkuMasterModel.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});

describe('SKU Master API', () => {
  it('1. rejects a missing authentication token', async () => {
    expect((await request(app).get(endpoint)).status).toBe(401);
  });

  it('2. creates a SKU Master record', async () => {
    const response = await createSku();
    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject(baseSku);
  });

  it('3. preserves skuErpCode as a string', async () => {
    const response = await createSku({ skuErpCode: '0011423' });
    expect(response.body.data.skuErpCode).toBe('0011423');
    expect(typeof response.body.data.skuErpCode).toBe('string');
  });

  it('4. preserves eanCode as a string', async () => {
    const response = await createSku({ eanCode: '000123' });
    expect(response.body.data.eanCode).toBe('000123');
    expect(typeof response.body.data.eanCode).toBe('string');
  });

  it('5. trims and normalizes ERP codes', async () => {
    await createSku({ skuErpCode: '  FG-001  ' });
    const stored = await SkuMasterModel.findOne().lean();
    expect(stored?.skuErpCode).toBe('FG-001');
    expect(stored?.normalizedSkuErpCode).toBe('fg-001');
  });

  it('6. trims and normalizes EAN codes', async () => {
    await createSku({ eanCode: '  FG-P-F-0503  ' });
    const stored = await SkuMasterModel.findOne().lean();
    expect(stored?.eanCode).toBe('FG-P-F-0503');
    expect(stored?.normalizedEanCode).toBe('fg-p-f-0503');
  });

  it('7. rejects a duplicate ERP code', async () => {
    await createSku();
    const response = await createSku({ eanCode: 'OTHER-EAN' });
    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('duplicate_sku_erp_code');
  });

  it('8. checks duplicate ERP codes case-insensitively and after trimming', async () => {
    await createSku({ skuErpCode: 'FG-ERP-1' });
    const response = await createSku({
      skuErpCode: ' fg-erp-1 ',
      eanCode: 'OTHER-EAN',
    });
    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('duplicate_sku_erp_code');
  });

  it('9. rejects a duplicate EAN code', async () => {
    await createSku();
    const response = await createSku({ skuErpCode: 'OTHER-ERP' });
    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('duplicate_ean_code');
  });

  it('10. checks duplicate EAN codes case-insensitively and after trimming', async () => {
    await createSku({ eanCode: 'FG-EAN-1' });
    const response = await createSku({
      skuErpCode: 'OTHER-ERP',
      eanCode: ' fg-ean-1 ',
    });
    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('duplicate_ean_code');
  });

  it('11. rejects a missing name', async () => {
    const payload: Record<string, unknown> = { ...baseSku };
    delete payload.name;
    expect((await request(app).post(endpoint).set(auth).send(payload)).status).toBe(400);
  });

  it('12. rejects a missing ERP code', async () => {
    const payload: Record<string, unknown> = { ...baseSku };
    delete payload.skuErpCode;
    expect((await request(app).post(endpoint).set(auth).send(payload)).status).toBe(400);
  });

  it('13. rejects a negative agreed rate', async () => {
    expect((await createSku({ agreedRate: -1 })).status).toBe(400);
  });

  it('14. rejects a negative MRP', async () => {
    expect((await createSku({ mrp: -1 })).status).toBe(400);
  });

  it('15. rejects a price tolerance above one', async () => {
    expect((await createSku({ priceTolerance: 1.01 })).status).toBe(400);
  });

  it('16. rejects a price tolerance below zero', async () => {
    expect((await createSku({ priceTolerance: -0.01 })).status).toBe(400);
  });

  it('17. returns pagination metadata', async () => {
    await createSku();
    const response = await request(app).get(endpoint).set(auth);
    expect(response.body.meta).toEqual({
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1,
    });
  });

  it('18. supports page and limit', async () => {
    await createSku({ skuErpCode: 'A', eanCode: 'EAN-A' });
    await createSku({ skuErpCode: 'B', eanCode: 'EAN-B' });
    const response = await request(app).get(`${endpoint}?page=2&limit=1`).set(auth);
    expect(response.body.meta).toMatchObject({ page: 2, limit: 1, total: 2 });
    expect(response.body.data).toHaveLength(1);
  });

  it('19. supports sorting', async () => {
    await createSku({ skuErpCode: 'B', eanCode: 'EAN-B' });
    await createSku({ skuErpCode: 'A', eanCode: 'EAN-A' });
    const response = await request(app)
      .get(`${endpoint}?sortBy=skuErpCode&sortOrder=asc`)
      .set(auth);
    expect(response.body.data.map((item: { skuErpCode: string }) => item.skuErpCode)).toEqual([
      'A',
      'B',
    ]);
  });

  it('20. searches by SKU name', async () => {
    await createSku();
    const response = await request(app).get(`${endpoint}?search=Cheesy`).set(auth);
    expect(response.body.data).toHaveLength(1);
  });

  it('21. searches by ERP code', async () => {
    await createSku();
    const response = await request(app).get(`${endpoint}?search=11423`).set(auth);
    expect(response.body.data).toHaveLength(1);
  });

  it('22. searches by EAN code', async () => {
    await createSku();
    const response = await request(app).get(`${endpoint}?search=F-0503`).set(auth);
    expect(response.body.data).toHaveLength(1);
  });

  it('23. safely escapes regular-expression search input', async () => {
    await createSku();
    const response = await request(app).get(`${endpoint}?search=.*`).set(auth);
    expect(response.body.data).toEqual([]);
  });

  it('24. gets a SKU by ID', async () => {
    const created = await createSku();
    const response = await request(app).get(`${endpoint}/${created.body.data.id}`).set(auth);
    expect(response.status).toBe(200);
    expect(response.body.data.id).toBe(created.body.data.id);
  });

  it('25. rejects an invalid ObjectId', async () => {
    const response = await request(app).get(`${endpoint}/invalid`).set(auth);
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('invalid_resource_id');
  });

  it('26. returns 404 for an unknown valid ObjectId', async () => {
    const response = await request(app)
      .get(`${endpoint}/${new Types.ObjectId().toString()}`)
      .set(auth);
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('sku_master_not_found');
  });

  it('27. updates a name', async () => {
    const created = await createSku();
    const response = await request(app)
      .patch(`${endpoint}/${created.body.data.id}`)
      .set(auth)
      .send({ name: 'Updated name' });
    expect(response.body.data.name).toBe('Updated name');
  });

  it('28. updates price fields', async () => {
    const created = await createSku();
    const response = await request(app)
      .patch(`${endpoint}/${created.body.data.id}`)
      .set(auth)
      .send({ agreedRate: 10.25, mrp: 15, priceTolerance: 0.1 });
    expect(response.body.data).toMatchObject({
      agreedRate: 10.25,
      mrp: 15,
      priceTolerance: 0.1,
    });
  });

  it('29. checks duplicate ERP codes during update', async () => {
    const first = await createSku({ skuErpCode: 'ERP-1', eanCode: 'EAN-1' });
    await createSku({ skuErpCode: 'ERP-2', eanCode: 'EAN-2' });
    const response = await request(app)
      .patch(`${endpoint}/${first.body.data.id}`)
      .set(auth)
      .send({ skuErpCode: ' erp-2 ' });
    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('duplicate_sku_erp_code');
  });

  it('30. checks duplicate EAN codes during update', async () => {
    const first = await createSku({ skuErpCode: 'ERP-1', eanCode: 'EAN-1' });
    await createSku({ skuErpCode: 'ERP-2', eanCode: 'EAN-2' });
    const response = await request(app)
      .patch(`${endpoint}/${first.body.data.id}`)
      .set(auth)
      .send({ eanCode: ' ean-2 ' });
    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('duplicate_ean_code');
  });

  it('31. rejects an empty update body', async () => {
    const created = await createSku();
    expect(
      (await request(app).patch(`${endpoint}/${created.body.data.id}`).set(auth).send({})).status,
    ).toBe(400);
  });

  it('32. clears optional string fields', async () => {
    const created = await createSku();
    const response = await request(app)
      .patch(`${endpoint}/${created.body.data.id}`)
      .set(auth)
      .send({ eanCode: '', hsnCode: '', uom: '' });
    expect(response.status).toBe(200);
    expect(response.body.data).not.toHaveProperty('eanCode');
    expect(response.body.data).not.toHaveProperty('hsnCode');
    expect(response.body.data).not.toHaveProperty('uom');
  });

  it('33. deletes a SKU', async () => {
    const created = await createSku();
    const response = await request(app).delete(`${endpoint}/${created.body.data.id}`).set(auth);
    expect(response.status).toBe(204);
    expect(response.text).toBe('');
  });

  it('34. returns 404 for a deleted SKU', async () => {
    const created = await createSku();
    await request(app).delete(`${endpoint}/${created.body.data.id}`).set(auth);
    expect((await request(app).get(`${endpoint}/${created.body.data.id}`).set(auth)).status).toBe(
      404,
    );
  });

  it('35. does not expose normalized fields', async () => {
    const response = await createSku();
    expect(response.body.data).not.toHaveProperty('normalizedSkuErpCode');
    expect(response.body.data).not.toHaveProperty('normalizedEanCode');
  });

  it('36. does not expose __v', async () => {
    const response = await createSku();
    expect(response.body.data).not.toHaveProperty('__v');
  });

  it('37. seeds idempotently', async () => {
    const first = await seedSkuMaster();
    const second = await seedSkuMaster();
    expect(first).toEqual({ created: SKU_MASTER_SEED_DATA.length, updated: 0, unchanged: 0 });
    expect(second).toEqual({ created: 0, updated: 0, unchanged: SKU_MASTER_SEED_DATA.length });
    expect(await SkuMasterModel.countDocuments()).toBe(SKU_MASTER_SEED_DATA.length);
  });

  it('rejects protected/internal fields', async () => {
    const response = await createSku({ normalizedSkuErpCode: 'protected' });
    expect(response.status).toBe(400);
  });
});
