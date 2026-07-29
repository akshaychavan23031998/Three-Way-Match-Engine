import type {
  MatchStatus,
  PaginationMeta,
  SummaryListQuery,
  SummaryRow,
} from '@three-way-match/shared';
import { GrnModel } from '../../models/grn.model.js';
import { InvoiceModel } from '../../models/invoice.model.js';
import { MatchAuditModel } from '../../models/match-audit.model.js';
import { PurchaseOrderModel } from '../../models/purchase-order.model.js';

interface MutableSummary {
  normalizedPoNumber: string;
  poNumber: string;
  purchaseOrderCount: number;
  grnCount: number;
  invoiceCount: number;
  supplierName?: string | undefined;
  poDate?: Date | undefined;
  latestDocumentDate?: Date | undefined;
  poAmount: number;
  invoiceAmount: number;
  updatedAt: Date;
}
const later = (first: Date | undefined, second: Date): Date =>
  !first || second > first ? second : first;
const get = (
  map: Map<string, MutableSummary>,
  normalized: string,
  poNumber: string,
  date: Date,
) => {
  const current = map.get(normalized);
  if (current) return current;
  const value: MutableSummary = {
    normalizedPoNumber: normalized,
    poNumber,
    purchaseOrderCount: 0,
    grnCount: 0,
    invoiceCount: 0,
    poAmount: 0,
    invoiceAmount: 0,
    updatedAt: date,
  };
  map.set(normalized, value);
  return value;
};
const money = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100;

export const listSummary = async (
  query: SummaryListQuery,
): Promise<{ data: SummaryRow[]; meta: PaginationMeta }> => {
  const [purchaseOrders, grns, invoices, audits] = await Promise.all([
    PurchaseOrderModel.find().lean().exec(),
    GrnModel.find().lean().exec(),
    InvoiceModel.find().lean().exec(),
    MatchAuditModel.find().sort({ computedAt: -1, _id: -1 }).lean().exec(),
  ]);
  const summaries = new Map<string, MutableSummary>();
  for (const document of purchaseOrders) {
    const row = get(summaries, document.normalizedPoNumber, document.poNumber, document.updatedAt);
    row.purchaseOrderCount += 1;
    row.poNumber = document.poNumber;
    row.poDate = !row.poDate || document.poDate < row.poDate ? document.poDate : row.poDate;
    row.latestDocumentDate = later(row.latestDocumentDate, document.poDate);
    row.updatedAt = later(row.updatedAt, document.updatedAt);
    row.supplierName ??= document.supplierName;
    row.poAmount += document.items.reduce(
      (sum, item) => sum + (item.lineTotal ?? item.quantity * item.unitPrice),
      0,
    );
  }
  for (const document of grns) {
    const row = get(summaries, document.normalizedPoNumber, document.poNumber, document.updatedAt);
    row.grnCount += 1;
    row.latestDocumentDate = later(row.latestDocumentDate, document.grnDate);
    row.updatedAt = later(row.updatedAt, document.updatedAt);
    row.supplierName ??= document.supplierName;
  }
  for (const document of invoices) {
    const row = get(summaries, document.normalizedPoNumber, document.poNumber, document.updatedAt);
    row.invoiceCount += 1;
    row.latestDocumentDate = later(row.latestDocumentDate, document.invoiceDate);
    row.updatedAt = later(row.updatedAt, document.updatedAt);
    row.supplierName ??= document.supplierName;
    row.invoiceAmount += document.items.reduce(
      (sum, item) => sum + (item.lineTotal ?? item.invoicedQuantity * item.unitPrice),
      0,
    );
  }
  const latestAudits = new Map<string, (typeof audits)[number]>();
  for (const audit of audits)
    if (!latestAudits.has(audit.normalizedPoNumber))
      latestAudits.set(audit.normalizedPoNumber, audit);
  let rows: SummaryRow[] = [...summaries.values()].map((row) => {
    const audit = latestAudits.get(row.normalizedPoNumber);
    const status: MatchStatus = audit?.status ?? 'pending';
    return {
      poNumber: row.poNumber,
      ...(audit ? { latestMatchAuditId: audit._id.toString() } : {}),
      status,
      purchaseOrderCount: row.purchaseOrderCount,
      grnCount: row.grnCount,
      invoiceCount: row.invoiceCount,
      ...(row.supplierName ? { supplierName: row.supplierName } : {}),
      ...(row.poDate ? { poDate: row.poDate.toISOString() } : {}),
      ...(row.latestDocumentDate
        ? { latestDocumentDate: row.latestDocumentDate.toISOString() }
        : {}),
      poAmount: audit?.totals.poAmount ?? money(row.poAmount),
      invoiceAmount: audit?.totals.invoiceAmount ?? money(row.invoiceAmount),
      amountDifference: audit?.totals.amountDifference ?? money(row.invoiceAmount - row.poAmount),
      mismatchCount: audit?.reasons.filter(({ severity }) => severity === 'error').length ?? 0,
      warningCount: audit?.reasons.filter(({ severity }) => severity === 'warning').length ?? 0,
      ...(audit ? { lastComputedAt: audit.computedAt.toISOString() } : {}),
      updatedAt: later(row.updatedAt, audit?.updatedAt ?? row.updatedAt).toISOString(),
    };
  });
  if (query.search) {
    const needle = query.search.toLocaleLowerCase();
    rows = rows.filter(
      (row) =>
        row.poNumber.toLocaleLowerCase().includes(needle) ||
        row.supplierName?.toLocaleLowerCase().includes(needle),
    );
  }
  if (query.status) rows = rows.filter(({ status }) => status === query.status);
  const direction = query.sortOrder === 'asc' ? 1 : -1;
  rows.sort((a, b) => {
    const first = a[query.sortBy];
    const second = b[query.sortBy];
    const comparison =
      typeof first === 'number' && typeof second === 'number'
        ? first - second
        : String(first).localeCompare(String(second));
    return comparison * direction || a.poNumber.localeCompare(b.poNumber);
  });
  const total = rows.length;
  return {
    data: rows.slice((query.page - 1) * query.limit, query.page * query.limit),
    meta: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: total ? Math.ceil(total / query.limit) : 0,
    },
  };
};

export class SummaryService {}
