import { summaryListQuerySchema } from '../schemas/summary.schema.js';
import { listSummary } from '../services/summary/summary.service.js';
import { asyncHandler } from '../utils/async-handler.js';
import { sendSuccess } from '../utils/response.js';

export const getSummary = asyncHandler(async (req, res) => {
  const result = await listSummary(summaryListQuerySchema.parse(req.query));
  sendSuccess(res, result.data, result.meta);
});
