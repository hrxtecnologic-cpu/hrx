/**
 * API Types
 *
 * Tipos TypeScript para respostas de API padronizadas
 */

// =====================================================
// Generic API Response
// =====================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

// =====================================================
// Paginated Response
// =====================================================

export interface PaginatedResponse<T = unknown> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
  message?: string;
}

// =====================================================
// Error Response Types
// =====================================================

export type ApiErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'RATE_LIMIT_EXCEEDED'
  | 'INTERNAL_ERROR'
  | 'BAD_REQUEST'
  | 'CONFLICT';

export interface ApiError {
  code: ApiErrorCode;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

// =====================================================
// Request Types
// =====================================================

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface SortParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SearchParams extends PaginationParams, SortParams {
  query?: string;
}

// =====================================================
// Status Response
// =====================================================

export interface StatusResponse {
  success: boolean;
  status: string;
  message?: string;
  updatedBy?: string;
  updatedAt?: string;
}

// =====================================================
// Upload Response
// =====================================================

export interface UploadResponse {
  success: boolean;
  url?: string;
  fileName?: string;
  fileSize?: number;
  message?: string;
  error?: string;
}

export interface MultiUploadResponse {
  success: boolean;
  uploads: {
    [key: string]: {
      success: boolean;
      url?: string;
      error?: string;
    };
  };
  message?: string;
}

// =====================================================
// Batch Operation Response
// =====================================================

export interface BatchOperationResponse<T = unknown> {
  success: boolean;
  results: {
    successful: T[];
    failed: Array<{
      item: T;
      error: string;
    }>;
  };
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
  message?: string;
}

// =====================================================
// Notification Response
// =====================================================

export interface NotificationResponse {
  success: boolean;
  sent: number;
  failed: number;
  recipients: string[];
  message?: string;
}
