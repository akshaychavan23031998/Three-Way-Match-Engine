import {
  matchHistoryQuerySchema,
  type MatchAuditIdParams,
  type MatchPoNumberParams,
} from '../schemas/match.schema.js';
import {
  computeMatchForPoNumber,
  getLatestOrComputeMatch,
  getMatchAuditById,
  getMatchHistory as getHistory,
} from '../services/matching/compute-match.service.js';
import { AppError } from '../utils/app-error.js';
import { asyncHandler } from '../utils/async-handler.js';
import { sendSuccess } from '../utils/response.js';

const userEmail = (email?: string): string => {
  if (!email) throw new AppError(401, 'unauthorized', 'A valid bearer token is required');
  return email;
};

export const getMatch = asyncHandler<MatchPoNumberParams>(async (req, res) => {
  sendSuccess(res, await getLatestOrComputeMatch(req.params.poNumber, userEmail(req.user?.email)));
});
export const recomputeMatch = asyncHandler<MatchPoNumberParams>(async (req, res) => {
  sendSuccess(
    res,
    await computeMatchForPoNumber(req.params.poNumber, {
      trigger: 'manual_recompute',
      triggeredBy: userEmail(req.user?.email),
      persistAudit: true,
    }),
  );
});
export const getMatchHistory = asyncHandler<MatchPoNumberParams>(async (req, res) => {
  const query = matchHistoryQuerySchema.parse(req.query);
  const result = await getHistory(req.params.poNumber, query.page, query.limit);
  sendSuccess(res, result.data, result.meta);
});
export const getMatchAudit = asyncHandler<MatchAuditIdParams>(async (req, res) => {
  sendSuccess(res, await getMatchAuditById(req.params.id));
});
