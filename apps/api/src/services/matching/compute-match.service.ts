import type {
  MatchAudit,
  MatchDocumentReference,
  MatchItem,
  MatchReason,
  MatchTotals,
  MatchTrigger,
  PaginationMeta,
} from '@three-way-match/shared';
import {
  countMatchAuditsByNormalizedPoNumber,
  createMatchAudit,
  findLatestMatchByNormalizedPoNumber,
  findMatchAuditById,
  listMatchAuditsByNormalizedPoNumber,
  type MatchAuditRecord,
} from '../../repositories/match-audit.repository.js';
import {
  findGrnsByNormalizedPoNumber,
  findInvoicesByNormalizedPoNumber,
  findPurchaseOrdersByNormalizedPoNumber,
} from '../../repositories/document.repository.js';
import type { AggregatedMatchItem, MatchLine, SkuResolution } from '../../types/match.types.js';
import { AppError } from '../../utils/app-error.js';
import { normalizeCode } from '../../utils/normalize-code.js';
import { resolveSkuItems } from '../sku/sku-resolution.service.js';
import { aggregateItems } from './aggregate-items.js';
import { determineStatus } from './determine-status.js';
import { checkDuplicateDocument } from './rules/check-duplicate-document.js';
import { checkDuplicatePo } from './rules/check-duplicate-po.js';
import { checkGrnQuantity } from './rules/check-grn-quantity.js';
import { checkInvoiceDate } from './rules/check-invoice-date.js';
import { checkInvoiceQuantity } from './rules/check-invoice-quantity.js';
import { checkMissingDocumentItems } from './rules/check-missing-po-item.js';
import { checkMrp } from './rules/check-mrp.js';
import { checkPrice } from './rules/check-price.js';
import { checkUnmappedSku } from './rules/check-unmapped-sku.js';

export interface ComputeMatchOptions {
  trigger: MatchTrigger;
  triggeredBy: string;
  persistAudit?: boolean | undefined;
}

const roundMoney = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100;
const stableStringify = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (typeof value === 'object' && value !== null)
    return `{${Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, entry]) => `${key}:${stableStringify(entry)}`)
      .join(',')}}`;
  return JSON.stringify(value);
};
export const deduplicateReasons = (reasons: MatchReason[]): MatchReason[] => {
  const unique = new Map<string, MatchReason>();
  for (const reason of reasons)
    unique.set(`${reason.code}:${reason.severity}:${stableStringify(reason.details)}`, reason);
  return [...unique.values()].sort(
    (a, b) =>
      a.code.localeCompare(b.code) ||
      a.severity.localeCompare(b.severity) ||
      stableStringify(a.details).localeCompare(stableStringify(b.details)),
  );
};

const serializeAudit = (record: MatchAuditRecord): MatchAudit => ({
  id: record._id.toString(),
  poNumber: record.poNumber,
  status: record.status,
  reasons: record.reasons,
  items: record.items,
  documentReferences: record.documentReferences,
  totals: record.totals,
  computedAt: record.computedAt.toISOString(),
  computationVersion: record.computationVersion,
  trigger: record.trigger,
  triggeredBy: record.triggeredBy,
  createdAt: record.createdAt.toISOString(),
  updatedAt: record.updatedAt.toISOString(),
});

const publicItem = (item: AggregatedMatchItem): MatchItem => {
  const status = determineStatus({
    hasPo: item.orderedQuantity > 0,
    hasGrn: item.receivedQuantity > 0,
    hasInvoice: item.invoicedQuantity > 0,
    reasons: item.reasons,
  });
  return {
    matchKey: item.matchKey,
    status,
    ...(item.skuMasterId ? { skuMasterId: item.skuMasterId } : {}),
    ...(item.skuErpCode ? { skuErpCode: item.skuErpCode } : {}),
    ...(item.eanCode ? { eanCode: item.eanCode } : {}),
    ...(item.skuName ? { skuName: item.skuName } : {}),
    ...(item.description ? { description: item.description } : {}),
    resolutionMethod: item.resolutionMethod,
    sourceReferences: item.sourceReferences,
    orderedQuantity: item.orderedQuantity,
    receivedQuantity: item.receivedQuantity,
    acceptedQuantity: item.acceptedQuantity,
    rejectedQuantity: item.rejectedQuantity,
    invoicedQuantity: item.invoicedQuantity,
    pendingDelivery: item.pendingDelivery,
    poPrices: item.poPrices,
    invoicePrices: item.invoicePrices,
    ...(item.agreedRate !== undefined ? { agreedRate: item.agreedRate } : {}),
    ...(item.priceTolerance !== undefined ? { priceTolerance: item.priceTolerance } : {}),
    ...(item.masterMrp !== undefined ? { masterMrp: item.masterMrp } : {}),
    poMrps: item.poMrps,
    grnMrps: item.grnMrps,
    invoiceMrps: item.invoiceMrps,
    reasons: item.reasons,
  };
};

export const computeMatchForPoNumber = async (
  poNumber: string,
  options: ComputeMatchOptions,
): Promise<MatchAudit> => {
  const normalizedPoNumber = normalizeCode(poNumber);
  if (!normalizedPoNumber)
    throw new AppError(400, 'invalid_po_number', 'A valid PO number is required');
  const [purchaseOrders, grns, invoices] = await Promise.all([
    findPurchaseOrdersByNormalizedPoNumber(normalizedPoNumber),
    findGrnsByNormalizedPoNumber(normalizedPoNumber),
    findInvoicesByNormalizedPoNumber(normalizedPoNumber),
  ]);
  const provisional: Omit<MatchLine, 'resolution'>[] = [];
  for (const document of purchaseOrders)
    document.items.forEach((item, lineIndex) =>
      provisional.push({
        sourceType: 'purchase_order',
        documentId: document._id.toString(),
        documentNumber: document.poNumber,
        documentDate: document.poDate,
        lineIndex,
        ...(item.lineNumber !== undefined ? { lineNumber: item.lineNumber } : {}),
        description: item.description,
        ...(item.skuErpCode ? { skuErpCode: item.skuErpCode } : {}),
        ...(item.eanCode ? { eanCode: item.eanCode } : {}),
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        ...(item.mrp !== undefined ? { mrp: item.mrp } : {}),
      }),
    );
  for (const document of grns)
    document.items.forEach((item, lineIndex) =>
      provisional.push({
        sourceType: 'grn',
        documentId: document._id.toString(),
        documentNumber: document.grnNumber,
        documentDate: document.grnDate,
        lineIndex,
        ...(item.lineNumber !== undefined ? { lineNumber: item.lineNumber } : {}),
        description: item.description,
        ...(item.skuErpCode ? { skuErpCode: item.skuErpCode } : {}),
        ...(item.eanCode ? { eanCode: item.eanCode } : {}),
        quantity: item.receivedQuantity,
        ...(item.acceptedQuantity !== undefined ? { acceptedQuantity: item.acceptedQuantity } : {}),
        ...(item.rejectedQuantity !== undefined ? { rejectedQuantity: item.rejectedQuantity } : {}),
        ...(item.mrp !== undefined ? { mrp: item.mrp } : {}),
      }),
    );
  for (const document of invoices)
    document.items.forEach((item, lineIndex) =>
      provisional.push({
        sourceType: 'invoice',
        documentId: document._id.toString(),
        documentNumber: document.invoiceNumber,
        documentDate: document.invoiceDate,
        lineIndex,
        ...(item.lineNumber !== undefined ? { lineNumber: item.lineNumber } : {}),
        description: item.description,
        ...(item.skuErpCode ? { skuErpCode: item.skuErpCode } : {}),
        ...(item.eanCode ? { eanCode: item.eanCode } : {}),
        quantity: item.invoicedQuantity,
        unitPrice: item.unitPrice,
        ...(item.mrp !== undefined ? { mrp: item.mrp } : {}),
      }),
    );
  const resolutions = await resolveSkuItems(provisional);
  const lines: MatchLine[] = provisional.map((line, index) => ({
    ...line,
    resolution: resolutions[index] ?? ({ resolutionMethod: 'unresolved' } satisfies SkuResolution),
  }));
  const aggregated = aggregateItems(lines);
  for (const item of aggregated) {
    item.reasons = deduplicateReasons([
      ...checkUnmappedSku(item),
      ...checkMissingDocumentItems(item, {
        hasGrns: grns.length > 0,
        hasInvoices: invoices.length > 0,
      }),
      ...checkGrnQuantity(item),
      ...checkInvoiceQuantity(item),
      ...checkPrice(item),
      ...checkMrp(item),
      ...checkInvoiceDate(item),
    ]);
  }
  const duplicateReasons = [
    ...checkDuplicatePo(
      purchaseOrders.map((document) => ({
        id: document._id.toString(),
        number: document.poNumber,
        normalizedNumber: document.normalizedPoNumber,
      })),
    ),
    ...checkDuplicateDocument(
      grns.map((document) => ({
        id: document._id.toString(),
        number: document.grnNumber,
        normalizedNumber: document.normalizedGrnNumber,
      })),
      'grn',
    ),
    ...checkDuplicateDocument(
      invoices.map((document) => ({
        id: document._id.toString(),
        number: document.invoiceNumber,
        normalizedNumber: document.normalizedInvoiceNumber,
      })),
      'invoice',
    ),
  ];
  const reasons = deduplicateReasons([
    ...duplicateReasons,
    ...aggregated.flatMap((item) => item.reasons),
  ]);
  const items = aggregated.map(publicItem);
  const status = determineStatus({
    hasPo: purchaseOrders.length > 0,
    hasGrn: grns.length > 0,
    hasInvoice: invoices.length > 0,
    reasons,
  });
  const poAmount = roundMoney(
    purchaseOrders
      .flatMap(({ items }) => items)
      .reduce((sum, item) => sum + (item.lineTotal ?? item.quantity * item.unitPrice), 0),
  );
  const invoiceAmount = roundMoney(
    invoices
      .flatMap(({ items }) => items)
      .reduce((sum, item) => sum + (item.lineTotal ?? item.invoicedQuantity * item.unitPrice), 0),
  );
  const totals: MatchTotals = {
    poItemCount: purchaseOrders.reduce((sum, document) => sum + document.items.length, 0),
    grnItemCount: grns.reduce((sum, document) => sum + document.items.length, 0),
    invoiceItemCount: invoices.reduce((sum, document) => sum + document.items.length, 0),
    matchedItemCount: items.filter(({ status: itemStatus }) => itemStatus === 'matched').length,
    mismatchedItemCount: items.filter(({ reasons: itemReasons }) =>
      itemReasons.some(({ severity }) => severity === 'error'),
    ).length,
    orderedQuantity: items.reduce((sum, item) => sum + item.orderedQuantity, 0),
    receivedQuantity: items.reduce((sum, item) => sum + item.receivedQuantity, 0),
    acceptedQuantity: items.reduce((sum, item) => sum + item.acceptedQuantity, 0),
    rejectedQuantity: items.reduce((sum, item) => sum + item.rejectedQuantity, 0),
    invoicedQuantity: items.reduce((sum, item) => sum + item.invoicedQuantity, 0),
    poAmount,
    invoiceAmount,
    amountDifference: roundMoney(invoiceAmount - poAmount),
  };
  const documentReferences: MatchDocumentReference[] = [
    ...purchaseOrders.map((document) => ({
      id: document._id.toString(),
      documentType: 'purchase_order' as const,
      documentNumber: document.poNumber,
      createdAt: document.createdAt.toISOString(),
    })),
    ...grns.map((document) => ({
      id: document._id.toString(),
      documentType: 'grn' as const,
      documentNumber: document.grnNumber,
      createdAt: document.createdAt.toISOString(),
    })),
    ...invoices.map((document) => ({
      id: document._id.toString(),
      documentType: 'invoice' as const,
      documentNumber: document.invoiceNumber,
      createdAt: document.createdAt.toISOString(),
    })),
  ].sort(
    (a, b) =>
      a.documentType.localeCompare(b.documentType) ||
      a.documentNumber.localeCompare(b.documentNumber) ||
      a.id.localeCompare(b.id),
  );
  const now = new Date();
  const auditValue = {
    poNumber:
      purchaseOrders[0]?.poNumber ?? grns[0]?.poNumber ?? invoices[0]?.poNumber ?? poNumber.trim(),
    normalizedPoNumber,
    status,
    reasons,
    items,
    documentReferences,
    totals,
    computedAt: now,
    computationVersion: '1.0',
    trigger: options.trigger,
    triggeredBy: options.triggeredBy,
  } as const;
  if (options.persistAudit === false)
    return {
      id: '',
      ...auditValue,
      computedAt: now.toISOString(),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
  return serializeAudit(await createMatchAudit(auditValue));
};

export const getLatestOrComputeMatch = async (
  poNumber: string,
  triggeredBy: string,
): Promise<MatchAudit> => {
  const latest = await findLatestMatchByNormalizedPoNumber(normalizeCode(poNumber));
  return latest
    ? serializeAudit(latest)
    : computeMatchForPoNumber(poNumber, {
        trigger: 'api_request',
        triggeredBy,
        persistAudit: true,
      });
};

export const getMatchHistory = async (
  poNumber: string,
  page: number,
  limit: number,
): Promise<{ data: MatchAudit[]; meta: PaginationMeta }> => {
  const normalized = normalizeCode(poNumber);
  const [records, total] = await Promise.all([
    listMatchAuditsByNormalizedPoNumber(normalized, page, limit),
    countMatchAuditsByNormalizedPoNumber(normalized),
  ]);
  return {
    data: records.map(serializeAudit),
    meta: { page, limit, total, totalPages: total ? Math.ceil(total / limit) : 0 },
  };
};

export const getMatchAuditById = async (id: string): Promise<MatchAudit> => {
  const record = await findMatchAuditById(id);
  if (!record) throw new AppError(404, 'match_audit_not_found', 'Match audit was not found');
  return serializeAudit(record);
};

export class ComputeMatchService {}
