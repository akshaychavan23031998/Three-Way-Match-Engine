export interface SkuMaster {
  id: string;
  skuErpCode: string;
  normalizedSkuErpCode: string;
  name: string;
  eanCode: string;
  normalizedEanCode: string;
  hsnCode: string;
  uom: string;
  agreedRate: number;
  mrp: number;
  priceTolerance: number;
}

export type SkuMasterInput = Omit<SkuMaster, 'id' | 'normalizedSkuErpCode' | 'normalizedEanCode'>;
