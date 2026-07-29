export interface SkuMaster {
  id: string;
  skuErpCode: string;
  name: string;
  eanCode?: string | undefined;
  hsnCode?: string | undefined;
  uom?: string | undefined;
  agreedRate?: number | undefined;
  mrp?: number | undefined;
  priceTolerance: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSkuMasterInput {
  skuErpCode: string;
  name: string;
  eanCode?: string | undefined;
  hsnCode?: string | undefined;
  uom?: string | undefined;
  agreedRate?: number | undefined;
  mrp?: number | undefined;
  priceTolerance?: number | undefined;
}

export interface UpdateSkuMasterInput {
  skuErpCode?: string | undefined;
  name?: string | undefined;
  eanCode?: string | undefined;
  hsnCode?: string | undefined;
  uom?: string | undefined;
  agreedRate?: number | undefined;
  mrp?: number | undefined;
  priceTolerance?: number | undefined;
}

export interface SkuMasterListQuery {
  page: number;
  limit: number;
  search?: string | undefined;
  sortBy: 'createdAt' | 'updatedAt' | 'skuErpCode' | 'name';
  sortOrder: 'asc' | 'desc';
}

/** Backward-compatible frontend alias. */
export type SkuMasterInput = CreateSkuMasterInput;
