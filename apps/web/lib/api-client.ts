import axios, {
  AxiosError,
  type AxiosAdapter,
  type AxiosInstance,
  type AxiosRequestConfig,
} from 'axios';
import type {
  ApiErrorResponse,
  ApiSuccessResponse,
  CreateSkuMasterInput,
  DeleteDocumentResponse,
  DocumentDetail,
  DocumentListQuery,
  DocumentSummary,
  MatchAudit,
  MatchHistoryQuery,
  PaginationMeta,
  SkuMaster,
  SkuMasterListQuery,
  SummaryListQuery,
  SummaryRow,
  UpdateSkuMasterInput,
  UploadDocumentResponse,
} from '@three-way-match/shared';
import { authStorage } from './auth-storage';

const DEFAULT_API_URL = 'http://localhost:4000/api';
export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_URL).replace(
  /\/+$/,
  '',
);

let unauthorizedHandler: (() => void) | undefined;
let redirecting = false;
export const setUnauthorizedHandler = (handler?: () => void): void => {
  unauthorizedHandler = handler;
  if (handler) redirecting = false;
};

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details: unknown = null,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

const queryParams = (query: object): Record<string, string | number> =>
  Object.fromEntries(
    Object.entries(query).filter(([, value]) => value !== undefined && value !== ''),
  ) as Record<string, string | number>;

export class ApiClient {
  private readonly http: AxiosInstance;

  constructor(baseURL = API_BASE_URL, adapter?: AxiosAdapter) {
    this.http = axios.create({ baseURL, ...(adapter ? { adapter } : {}) });
    this.http.interceptors.request.use((config) => {
      const token = authStorage.get();
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });
    this.http.interceptors.response.use(undefined, (error: unknown) => {
      if (axios.isAxiosError(error) && error.response?.status === 401 && !redirecting) {
        redirecting = true;
        authStorage.clear();
        unauthorizedHandler?.();
        if (!unauthorizedHandler && typeof window !== 'undefined' && location.pathname !== '/login')
          location.assign('/login');
      }
      return Promise.reject(this.toApiError(error));
    });
  }

  private toApiError(error: unknown): ApiError {
    if (error instanceof ApiError) return error;
    if (error instanceof AxiosError) {
      const body = error.response?.data;
      if (
        typeof body === 'object' &&
        body !== null &&
        'success' in body &&
        body.success === false &&
        'error' in body
      ) {
        const payload = (body as ApiErrorResponse).error;
        return new ApiError(
          error.response?.status ?? 0,
          payload.code,
          payload.message,
          payload.details,
        );
      }
      return new ApiError(
        error.response?.status ?? 0,
        error.response ? 'invalid_api_response' : 'network_error',
        error.response ? 'The server returned an invalid response' : 'Unable to reach the API',
      );
    }
    return new ApiError(0, 'request_failed', 'The request could not be completed');
  }

  async request<T>(config: AxiosRequestConfig, signal?: AbortSignal): Promise<T> {
    const response = await this.http.request({
      ...config,
      ...(signal ? { signal } : {}),
    });
    if (response.status === 204) return undefined as T;
    const envelope: unknown = response.data;
    if (
      typeof envelope !== 'object' ||
      envelope === null ||
      !('success' in envelope) ||
      envelope.success !== true ||
      !('data' in envelope)
    )
      throw new ApiError(
        response.status,
        'invalid_api_response',
        'The server returned invalid JSON',
      );
    return (envelope as ApiSuccessResponse<T>).data;
  }

  async paginated<T>(
    config: AxiosRequestConfig,
    signal?: AbortSignal,
  ): Promise<PaginatedResult<T>> {
    const response = await this.http.request({
      ...config,
      ...(signal ? { signal } : {}),
    });
    const envelope: unknown = response.data;
    if (
      typeof envelope !== 'object' ||
      envelope === null ||
      !('success' in envelope) ||
      envelope.success !== true ||
      !('data' in envelope) ||
      !Array.isArray(envelope.data)
    )
      throw new ApiError(
        response.status,
        'invalid_api_response',
        'The server returned invalid JSON',
      );
    const typed = envelope as ApiSuccessResponse<T[]>;
    const meta = typed.meta;
    if (
      !meta ||
      !('page' in meta) ||
      !('limit' in meta) ||
      !('total' in meta) ||
      !('totalPages' in meta)
    )
      throw new ApiError(response.status, 'invalid_api_response', 'Pagination metadata is missing');
    return { data: typed.data, meta: meta as PaginationMeta };
  }

  validateToken = (signal?: AbortSignal): Promise<{ authenticated: true }> =>
    this.request({ method: 'GET', url: '/auth/validate' }, signal);

  listSkuMasters = (query: SkuMasterListQuery, signal?: AbortSignal) =>
    this.paginated<SkuMaster>(
      { method: 'GET', url: '/masters/sku', params: queryParams(query) },
      signal,
    );
  getSkuMaster = (id: string, signal?: AbortSignal) =>
    this.request<SkuMaster>({ method: 'GET', url: `/masters/sku/${id}` }, signal);
  createSkuMaster = (input: CreateSkuMasterInput) =>
    this.request<SkuMaster>({ method: 'POST', url: '/masters/sku', data: input });
  updateSkuMaster = (id: string, input: UpdateSkuMasterInput) =>
    this.request<SkuMaster>({ method: 'PATCH', url: `/masters/sku/${id}`, data: input });
  deleteSkuMaster = (id: string) =>
    this.request<void>({ method: 'DELETE', url: `/masters/sku/${id}` });

  listDocuments = (query: DocumentListQuery, signal?: AbortSignal) =>
    this.paginated<DocumentSummary>(
      { method: 'GET', url: '/documents', params: queryParams(query) },
      signal,
    );
  getDocument = (id: string, signal?: AbortSignal) =>
    this.request<DocumentDetail>({ method: 'GET', url: `/documents/${id}` }, signal);
  uploadDocument = (form: FormData) =>
    this.request<UploadDocumentResponse>({ method: 'POST', url: '/documents/upload', data: form });
  deleteDocument = (id: string) =>
    this.request<DeleteDocumentResponse>({ method: 'DELETE', url: `/documents/${id}` });

  getMatch = (poNumber: string, signal?: AbortSignal) =>
    this.request<MatchAudit>(
      { method: 'GET', url: `/matches/${encodeURIComponent(poNumber)}` },
      signal,
    );
  recomputeMatch = (poNumber: string) =>
    this.request<MatchAudit>({
      method: 'POST',
      url: `/matches/${encodeURIComponent(poNumber)}/recompute`,
    });
  getMatchHistory = (poNumber: string, query: MatchHistoryQuery, signal?: AbortSignal) =>
    this.paginated<MatchAudit>(
      {
        method: 'GET',
        url: `/matches/${encodeURIComponent(poNumber)}/history`,
        params: queryParams(query),
      },
      signal,
    );
  getMatchAudit = (id: string, signal?: AbortSignal) =>
    this.request<MatchAudit>({ method: 'GET', url: `/matches/audits/${id}` }, signal);
  listSummary = (query: SummaryListQuery, signal?: AbortSignal) =>
    this.paginated<SummaryRow>(
      { method: 'GET', url: '/summary', params: queryParams(query) },
      signal,
    );
}

export const apiClient = new ApiClient();
