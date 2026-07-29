import type { AggregatedMatchItem, MatchLine } from '../../types/match.types.js';
import { buildMatchKey } from './build-match-key.js';

const round = (value: number): number => Math.round((value + Number.EPSILON) * 10000) / 10000;
const distinct = (values: number[]): number[] =>
  [...new Set(values.map(round))].sort((a, b) => a - b);

export const aggregateItems = (lines: MatchLine[]): AggregatedMatchItem[] => {
  const groups = new Map<string, MatchLine[]>();
  for (const line of lines) {
    const key = buildMatchKey(line);
    groups.set(key, [...(groups.get(key) ?? []), line]);
  }
  return [...groups.entries()]
    .sort(([first], [second]) => first.localeCompare(second))
    .map(([matchKey, group]) => {
      const first = group[0];
      if (!first) throw new Error('Cannot aggregate an empty item group');
      const po = group.filter(({ sourceType }) => sourceType === 'purchase_order');
      const grn = group.filter(({ sourceType }) => sourceType === 'grn');
      const invoices = group.filter(({ sourceType }) => sourceType === 'invoice');
      const orderedQuantity = round(po.reduce((sum, line) => sum + line.quantity, 0));
      const receivedQuantity = round(grn.reduce((sum, line) => sum + line.quantity, 0));
      const acceptedQuantity = round(
        grn.reduce((sum, line) => sum + (line.acceptedQuantity ?? line.quantity), 0),
      );
      const rejectedQuantity = round(
        grn.reduce((sum, line) => sum + (line.rejectedQuantity ?? 0), 0),
      );
      const invoicedQuantity = round(invoices.reduce((sum, line) => sum + line.quantity, 0));
      return {
        matchKey,
        ...(first.resolution.skuMasterId ? { skuMasterId: first.resolution.skuMasterId } : {}),
        ...((first.resolution.skuErpCode ?? first.skuErpCode)
          ? { skuErpCode: first.resolution.skuErpCode ?? first.skuErpCode }
          : {}),
        ...((first.resolution.eanCode ?? first.eanCode)
          ? { eanCode: first.resolution.eanCode ?? first.eanCode }
          : {}),
        ...(first.resolution.skuName ? { skuName: first.resolution.skuName } : {}),
        ...(first.description ? { description: first.description } : {}),
        resolutionMethod: first.resolution.resolutionMethod,
        sourceReferences: group
          .map((line) => ({
            documentId: line.documentId,
            documentType: line.sourceType,
            documentNumber: line.documentNumber,
            lineIndex: line.lineIndex,
            ...(line.lineNumber !== undefined ? { lineNumber: line.lineNumber } : {}),
          }))
          .sort(
            (a, b) =>
              a.documentType.localeCompare(b.documentType) ||
              a.documentNumber.localeCompare(b.documentNumber) ||
              a.lineIndex - b.lineIndex,
          ),
        orderedQuantity,
        receivedQuantity,
        acceptedQuantity,
        rejectedQuantity,
        invoicedQuantity,
        pendingDelivery: round(orderedQuantity - acceptedQuantity),
        poPrices: distinct(
          po.flatMap(({ unitPrice }) => (unitPrice === undefined ? [] : [unitPrice])),
        ),
        invoicePrices: distinct(
          invoices.flatMap(({ unitPrice }) => (unitPrice === undefined ? [] : [unitPrice])),
        ),
        poMrps: distinct(po.flatMap(({ mrp }) => (mrp === undefined ? [] : [mrp]))),
        grnMrps: distinct(grn.flatMap(({ mrp }) => (mrp === undefined ? [] : [mrp]))),
        invoiceMrps: distinct(invoices.flatMap(({ mrp }) => (mrp === undefined ? [] : [mrp]))),
        ...(first.resolution.agreedRate !== undefined
          ? { agreedRate: first.resolution.agreedRate }
          : {}),
        ...(first.resolution.mrp !== undefined ? { masterMrp: first.resolution.mrp } : {}),
        ...(first.resolution.priceTolerance !== undefined
          ? { priceTolerance: first.resolution.priceTolerance }
          : {}),
        poDates: po.map(({ documentDate }) => documentDate),
        invoiceDates: invoices.map(({ documentDate }) => documentDate),
        reasons: [],
      };
    });
};
