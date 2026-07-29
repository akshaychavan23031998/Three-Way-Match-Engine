export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: unknown;
  message?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details: unknown;
}

export interface ApiErrorResponse {
  success: false;
  error: ApiError;
}
