import type { MatchReason } from '@three-way-match/shared';
import type { AggregatedMatchItem } from '../../../types/match.types.js';
import { reason } from './reason.js';

const EPSILON = 0.000001;
export const isPriceWithinTolerance = (
  invoicePrice: number,
  poPrice: number,
  tolerance: number,
): boolean =>
  poPrice === 0
    ? Math.abs(invoicePrice) <= EPSILON
    : invoicePrice >= poPrice * (1 - tolerance) - EPSILON &&
      invoicePrice <= poPrice * (1 + tolerance) + EPSILON;

export const checkPrice = (item: AggregatedMatchItem): MatchReason[] => {
  if (item.invoicePrices.length === 0) return [];
  const referencePrices =
    item.poPrices.length > 0
      ? item.poPrices
      : item.agreedRate === undefined
        ? []
        : [item.agreedRate];
  if (referencePrices.length === 0) return [];
  const tolerance = item.priceTolerance ?? 0.05;
  const mismatched = item.invoicePrices.filter(
    (invoicePrice) =>
      !referencePrices.some((poPrice) => isPriceWithinTolerance(invoicePrice, poPrice, tolerance)),
  );
  if (mismatched.length === 0 && referencePrices.length === 1) return [];
  return [
    reason('price_mismatch', 'error', {
      poPrices: referencePrices,
      invoicePrices: item.invoicePrices,
      mismatchedInvoicePrices: mismatched,
      tolerance,
    }),
  ];
};
