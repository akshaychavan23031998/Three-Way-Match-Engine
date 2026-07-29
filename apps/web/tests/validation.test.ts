import { describe, expect, it } from 'vitest';
import { validateUploadFile, MAX_UPLOAD_BYTES } from '@/components/documents/upload-document-modal';
import { skuMasterFormSchema } from '@/components/sku/sku-master-form';
import { tokenLoginSchema } from '@/lib/validation';

describe('frontend validation', () => {
  it('rejects an empty login token', () => {
    expect(tokenLoginSchema.safeParse({ token: ' ' }).success).toBe(false);
  });
  it('preserves SKU identifier codes as strings', () => {
    const result = skuMasterFormSchema.parse({
      skuErpCode: '00123',
      name: 'Item',
      eanCode: '000456',
      hsnCode: '0010',
      agreedRate: '',
      mrp: '',
      priceTolerance: '0.05',
    });
    expect(result).toMatchObject({ skuErpCode: '00123', eanCode: '000456', hsnCode: '0010' });
  });
  it('rejects negative SKU prices', () => {
    expect(
      skuMasterFormSchema.safeParse({
        skuErpCode: '1',
        name: 'Item',
        agreedRate: '-1',
        priceTolerance: '0.05',
      }).success,
    ).toBe(false);
  });
  it('rejects price tolerance above one', () => {
    expect(
      skuMasterFormSchema.safeParse({
        skuErpCode: '1',
        name: 'Item',
        priceTolerance: '1.01',
      }).success,
    ).toBe(false);
  });
  it('rejects unsupported upload files', () => {
    expect(validateUploadFile(new File(['x'], 'bad.txt', { type: 'text/plain' }))).toContain('PDF');
  });
  it('rejects oversized upload files', () => {
    const file = new File(['x'], 'large.pdf', { type: 'application/pdf' });
    Object.defineProperty(file, 'size', { value: MAX_UPLOAD_BYTES + 1 });
    expect(validateUploadFile(file)).toContain('4 MB');
  });
});
