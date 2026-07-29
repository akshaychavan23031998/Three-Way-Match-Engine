import { Types } from 'mongoose';
import { describe, expect, it } from 'vitest';
import type { AggregatedMatchItem, MatchLine } from '../../src/types/match.types.js';
import { aggregateItems } from '../../src/services/matching/aggregate-items.js';
import { buildMatchKey } from '../../src/services/matching/build-match-key.js';
import { deduplicateReasons } from '../../src/services/matching/compute-match.service.js';
import { determineStatus } from '../../src/services/matching/determine-status.js';
import { checkDuplicateDocument } from '../../src/services/matching/rules/check-duplicate-document.js';
import { checkDuplicatePo } from '../../src/services/matching/rules/check-duplicate-po.js';
import { checkGrnQuantity } from '../../src/services/matching/rules/check-grn-quantity.js';
import { checkInvoiceDate } from '../../src/services/matching/rules/check-invoice-date.js';
import { checkInvoiceQuantity } from '../../src/services/matching/rules/check-invoice-quantity.js';
import { checkMrp } from '../../src/services/matching/rules/check-mrp.js';
import {
  checkPrice,
  isPriceWithinTolerance,
} from '../../src/services/matching/rules/check-price.js';
import { reason } from '../../src/services/matching/rules/reason.js';

const resolution = { skuMasterId: 'master-1', resolutionMethod: 'erp' as const };
const line = (
  sourceType: MatchLine['sourceType'],
  quantity: number,
  overrides: Partial<MatchLine> = {},
): MatchLine => ({
  sourceType,
  documentId: `${sourceType}-1`,
  documentNumber: `${sourceType}-number`,
  documentDate: new Date('2026-01-01'),
  lineIndex: 0,
  description: 'Item',
  skuErpCode: 'A',
  quantity,
  resolution,
  ...overrides,
});
const item = (overrides: Partial<AggregatedMatchItem> = {}): AggregatedMatchItem => ({
  matchKey: 'master:1',
  skuMasterId: '1',
  resolutionMethod: 'erp',
  sourceReferences: [],
  orderedQuantity: 10,
  receivedQuantity: 10,
  acceptedQuantity: 10,
  rejectedQuantity: 0,
  invoicedQuantity: 10,
  pendingDelivery: 0,
  poPrices: [100],
  invoicePrices: [100],
  poMrps: [150],
  grnMrps: [150],
  invoiceMrps: [150],
  poDates: [new Date('2026-01-01')],
  invoiceDates: [new Date('2026-01-01')],
  reasons: [],
  ...overrides,
});

describe('matching aggregation and identity', () => {
  it.each([
    ['PO', 'purchase_order' as const],
    ['GRN', 'grn' as const],
    ['invoice', 'invoice' as const],
  ])('aggregates repeated %s quantities', (_label, type) => {
    const result = aggregateItems([line(type, 2), line(type, 3, { lineIndex: 1 })])[0];
    expect(
      type === 'purchase_order'
        ? result?.orderedQuantity
        : type === 'grn'
          ? result?.receivedQuantity
          : result?.invoicedQuantity,
    ).toBe(5);
  });
  it('does not merge unrelated unresolved items', () => {
    const unresolved = { resolutionMethod: 'unresolved' as const };
    expect(
      aggregateItems([
        line('grn', 1, { skuErpCode: undefined, resolution: unresolved }),
        line('grn', 1, {
          documentId: 'other',
          skuErpCode: undefined,
          resolution: unresolved,
        }),
      ]),
    ).toHaveLength(2);
  });
  it('uses match-key priority', () => {
    expect(buildMatchKey(line('grn', 1))).toBe('master:master-1');
    expect(buildMatchKey(line('grn', 1, { resolution: { resolutionMethod: 'unresolved' } }))).toBe(
      'erp:a',
    );
  });
  it('preserves conflicting distinct prices', () => {
    expect(
      aggregateItems([
        line('invoice', 1, { unitPrice: 100 }),
        line('invoice', 1, { lineIndex: 1, unitPrice: 110 }),
      ])[0]?.invoicePrices,
    ).toEqual([100, 110]);
  });
});

describe('matching rules', () => {
  it.each([
    ['exact', 10, 0],
    ['under', 9, 1],
    ['over', 11, 1],
  ])('GRN quantity %s', (_label, acceptedQuantity, expected) => {
    expect(checkGrnQuantity(item({ acceptedQuantity }))).toHaveLength(expected);
  });
  it('rejects invoices above ordered quantity', () => {
    expect(checkInvoiceQuantity(item({ invoicedQuantity: 11 }))[0]?.severity).toBe('error');
  });
  it('rejects invoices above accepted quantity', () => {
    expect(
      checkInvoiceQuantity(item({ acceptedQuantity: 8, invoicedQuantity: 9 }))[0]?.severity,
    ).toBe('error');
  });
  it('warns on under-invoicing', () => {
    expect(checkInvoiceQuantity(item({ invoicedQuantity: 9 }))[0]?.severity).toBe('warning');
  });
  it.each([
    [100, 95, true],
    [100, 105, true],
    [100, 105.01, false],
    [0, 0, true],
    [0, 0.01, false],
  ])('compares price %s to %s safely', (poPrice, invoicePrice, expected) => {
    expect(isPriceWithinTolerance(invoicePrice, poPrice, 0.05)).toBe(expected);
  });
  it('detects multiple PO prices rather than averaging', () => {
    expect(checkPrice(item({ poPrices: [90, 100], invoicePrices: [100] }))).toHaveLength(1);
  });
  it.each([
    [[100, 100.01], 0],
    [[100, 100.02], 1],
  ])('checks MRP absolute tolerance', (values, count) => {
    expect(
      checkMrp(
        item({
          poMrps: [values[0] ?? 0],
          grnMrps: [],
          invoiceMrps: [values[1] ?? 0],
        }),
      ),
    ).toHaveLength(count);
  });
  it.each([
    ['2025-12-31', 1],
    ['2026-01-01', 0],
  ])('checks invoice date %s', (date, count) => {
    expect(checkInvoiceDate(item({ invoiceDates: [new Date(date)] }))).toHaveLength(count);
  });
});

describe('duplicates, statuses, and reason stability', () => {
  const document = (number: string, id = new Types.ObjectId().toString()) => ({
    id,
    number,
    normalizedNumber: number.toLowerCase(),
  });
  it('detects duplicate POs', () =>
    expect(checkDuplicatePo([document('PO'), document('PO')])).toHaveLength(1));
  it('detects duplicate GRNs but permits distinct GRNs', () => {
    expect(checkDuplicateDocument([document('G'), document('G')], 'grn')).toHaveLength(1);
    expect(checkDuplicateDocument([document('G1'), document('G2')], 'grn')).toHaveLength(0);
  });
  it('detects duplicate invoices but permits distinct invoices', () => {
    expect(checkDuplicateDocument([document('I'), document('I')], 'invoice')).toHaveLength(1);
    expect(checkDuplicateDocument([document('I1'), document('I2')], 'invoice')).toHaveLength(0);
  });
  it.each([
    ['matched', true, true, true, []],
    ['partially_matched', true, true, false, []],
    ['mismatched', true, true, true, [reason('price_mismatch', 'error')]],
    ['pending', true, false, false, []],
    ['pending', false, true, true, []],
  ] as const)('determines %s', (expected, hasPo, hasGrn, hasInvoice, reasons) => {
    expect(determineStatus({ hasPo, hasGrn, hasInvoice, reasons: [...reasons] })).toBe(expected);
  });
  it('deduplicates and deterministically sorts reasons', () => {
    const duplicate = reason('price_mismatch', 'error', { b: 2, a: 1 });
    const values = deduplicateReasons([
      duplicate,
      reason('mrp_mismatch', 'error'),
      { ...duplicate, details: { a: 1, b: 2 } },
    ]);
    expect(values.map(({ code }) => code)).toEqual(['mrp_mismatch', 'price_mismatch']);
  });
});
