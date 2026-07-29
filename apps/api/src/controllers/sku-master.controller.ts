import {
  createSkuMaster as createSkuMasterService,
  deleteSkuMaster as deleteSkuMasterService,
  getSkuMasterById,
  listSkuMasters as listSkuMastersService,
  updateSkuMaster as updateSkuMasterService,
} from '../services/sku/sku-master.service.js';
import type {
  CreateSkuMasterBody,
  SkuMasterIdParams,
  UpdateSkuMasterBody,
} from '../schemas/sku-master.schema.js';
import { skuMasterListQuerySchema } from '../schemas/sku-master.schema.js';
import { asyncHandler } from '../utils/async-handler.js';
import { sendCreated, sendNoContent, sendSuccess } from '../utils/response.js';

export const createSkuMaster = asyncHandler<Record<string, never>, unknown, CreateSkuMasterBody>(
  async (req, res) => {
    sendCreated(res, await createSkuMasterService(req.body));
  },
);

export const listSkuMasters = asyncHandler<Record<string, never>, unknown, unknown>(
  async (req, res) => {
    const query = skuMasterListQuerySchema.parse(req.query);
    const result = await listSkuMastersService(query);
    sendSuccess(res, result.data, result.meta);
  },
);

export const getSkuMaster = asyncHandler<SkuMasterIdParams>(async (req, res) => {
  sendSuccess(res, await getSkuMasterById(req.params.id));
});

export const updateSkuMaster = asyncHandler<SkuMasterIdParams, unknown, UpdateSkuMasterBody>(
  async (req, res) => {
    sendSuccess(res, await updateSkuMasterService(req.params.id, req.body));
  },
);

export const deleteSkuMaster = asyncHandler<SkuMasterIdParams>(async (req, res) => {
  await deleteSkuMasterService(req.params.id);
  sendNoContent(res);
});
