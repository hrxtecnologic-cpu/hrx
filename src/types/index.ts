/**
 * Type Exports
 *
 * Exporta todos os types do projeto de forma centralizada
 *
 * Uso:
 * import { Professional, ApiResponse, DocumentType } from '@/types';
 */

// =====================================================
// Professional Types
// =====================================================

export type {
  // Main types
  Professional,
  ProfessionalCreateInput,
  ProfessionalUpdateInput,
  ProfessionalWithDistance,
  ProfessionalStats,

  // Status types
  ProfessionalStatus,
  DocumentValidationStatus,

  // Category types
  ProfessionalCategory,

  // Document types from professional
  DocumentType,
  DocumentValidation,
  DocumentValidations,

  // Availability types
  Availability,
  DayAvailability,

  // Search types
  ProfessionalSearchFilters,
  ProfessionalSearchOptions,
  ProfessionalSearchResult,
} from './professional';

export { PROFESSIONAL_CATEGORIES } from './professional';

// =====================================================
// Contractor Types
// =====================================================

export type {
  Contractor,
  ContractorCreateInput,
  ContractorUpdateInput,
  ContractorStats,
  ContractorStatus,
  ContractorType,
} from './contractor';

// =====================================================
// Document Types
// =====================================================

export type {
  DocumentRequirement,
  CategoryDocumentRequirements,
  DocumentUpload,
  DocumentUploadProgress,
  DocumentValidationRequest,
  DocumentValidationResponse,
  DocumentView,
} from './document';

export {
  DOCUMENT_LABELS,
  ACCEPTED_IMAGE_FORMATS,
  ACCEPTED_PDF_FORMATS,
  MAX_FILE_SIZE_MB,
  DOCUMENT_REQUIREMENTS_BY_CATEGORY,
  BASIC_DOCUMENT_REQUIREMENTS,
  getDocumentRequirements,
  validateRequiredDocuments,
} from './document';

// =====================================================
// API Types
// =====================================================

export type {
  // Response types
  ApiResponse,
  PaginatedResponse,
  ApiError,
  ValidationError,
  StatusResponse,
  UploadResponse,
  MultiUploadResponse,
  BatchOperationResponse,
  NotificationResponse,

  // Error types
  ApiErrorCode,

  // Request types
  PaginationParams,
  SortParams,
  SearchParams,
} from './api';
