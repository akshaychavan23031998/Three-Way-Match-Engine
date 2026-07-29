import type { DocumentType, MatchReasonCode, MatchStatus } from '@three-way-match/shared';

const fallback = '—';
const validNumber = (value: number | null | undefined): value is number =>
  typeof value === 'number' && Number.isFinite(value);
export const formatNumber = (value: number | null | undefined): string =>
  validNumber(value) ? new Intl.NumberFormat('en-IN').format(value) : fallback;
export const formatQuantity = (value: number | null | undefined): string =>
  validNumber(value)
    ? new Intl.NumberFormat('en-IN', { maximumFractionDigits: 4 }).format(value)
    : fallback;
export const formatMoney = (value: number | null | undefined, currency?: string | null): string => {
  if (!validNumber(value)) return fallback;
  if (!currency) return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(value);
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return formatNumber(value);
  }
};
export const formatPercentage = (value: number | null | undefined): string =>
  validNumber(value)
    ? new Intl.NumberFormat('en-IN', { style: 'percent', maximumFractionDigits: 2 }).format(value)
    : fallback;
const dateValue = (value: string | Date | null | undefined): Date | null => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};
export const formatDate = (value: string | Date | null | undefined): string => {
  const date = dateValue(value);
  return date ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(date) : fallback;
};
export const formatDateTime = (value: string | Date | null | undefined): string => {
  const date = dateValue(value);
  return date
    ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
    : fallback;
};
export const formatFileSize = (bytes: number | null | undefined): string => {
  if (!validNumber(bytes) || bytes < 0) return fallback;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
};
export const documentLabel = (type: DocumentType): string =>
  ({ purchase_order: 'Purchase Order', grn: 'GRN', invoice: 'Invoice' })[type];
export const matchStatusLabel = (status: MatchStatus): string =>
  ({
    matched: 'Matched',
    partially_matched: 'Partially matched',
    mismatched: 'Mismatched',
    pending: 'Pending',
  })[status];
export const reasonCodeLabel = (code: MatchReasonCode): string =>
  code
    .split('_')
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(' ');
