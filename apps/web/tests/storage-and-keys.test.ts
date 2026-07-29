import { describe, expect, it } from 'vitest';
import { documentKeys } from '@/hooks/use-documents';
import { matchKeys } from '@/hooks/use-match';
import { skuKeys } from '@/hooks/use-sku-masters';
import { summaryKey } from '@/hooks/use-summary';
import { authStorage } from '@/lib/auth-storage';

describe('auth storage and query keys', () => {
  it('saves and clears auth tokens', () => {
    authStorage.set('token');
    expect(authStorage.get()).toBe('token');
    authStorage.clear();
    expect(authStorage.get()).toBeNull();
  });
  it('uses stable domain query key shapes', () => {
    expect(summaryKey({ page: 1, limit: 20, sortBy: 'updatedAt', sortOrder: 'desc' })[0]).toBe(
      'summary',
    );
    expect(documentKeys.detail('1')).toEqual(['document', '1']);
    expect(skuKeys.detail('2')).toEqual(['sku-master', '2']);
    expect(matchKeys.audit('3')).toEqual(['match-audit', '3']);
  });
});
