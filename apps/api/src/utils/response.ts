import type { Response } from 'express';

interface SuccessResponse<T, M = unknown> {
  success: true;
  data: T;
  meta?: M | null;
}

export const sendSuccess = <T, M = unknown>(
  res: Response,
  data: T,
  meta?: M | null,
): Response<SuccessResponse<T, M>> => {
  const body: SuccessResponse<T, M> =
    meta === undefined ? { success: true, data } : { success: true, data, meta };
  return res.status(200).json(body);
};

export const sendCreated = <T, M = unknown>(
  res: Response,
  data: T,
  meta?: M | null,
): Response<SuccessResponse<T, M>> => {
  const body: SuccessResponse<T, M> =
    meta === undefined ? { success: true, data } : { success: true, data, meta };
  return res.status(201).json(body);
};

export const sendNoContent = (res: Response): Response => res.status(204).send();

/** @deprecated Use sendSuccess or sendCreated. */
export const successResponse = <T>(res: Response, data: T, statusCode = 200): Response =>
  statusCode === 201
    ? sendCreated(res, data)
    : res.status(statusCode).json({ success: true, data });
