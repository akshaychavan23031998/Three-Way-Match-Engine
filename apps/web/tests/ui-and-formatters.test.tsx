import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ReasonBadge } from '@/components/match/reason-badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { formatDate, formatMoney, formatPercentage } from '@/lib/formatters';

describe('domain presentation', () => {
  it('renders a readable match status', () => {
    render(<StatusBadge status="partially_matched" />);
    expect(screen.getByText('Partially matched')).toBeInTheDocument();
  });
  it('renders a readable reason badge', () => {
    render(
      <ReasonBadge
        reason={{
          code: 'price_mismatch',
          message: 'Invoice price differs',
          severity: 'error',
          details: {},
        }}
      />,
    );
    expect(screen.getByText('Error: Price Mismatch')).toBeInTheDocument();
  });
  it('handles null, undefined, and invalid formatter values', () => {
    expect(formatMoney(undefined)).toBe('—');
    expect(formatDate('invalid')).toBe('—');
  });
  it('formats tolerance as a percentage', () => {
    expect(formatPercentage(0.05)).toBe('5%');
  });
});
