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
// Event Project Types (Unified Architecture)
// =====================================================

export type {
  // Main types
  EventProject,
  EventProjectSummary,
  EventProjectFull,
  EventProjectWithDetails,

  // Related entities
  ProjectTeamMember,
  ProjectTeamMemberWithProfessional,
  ProjectEquipment,
  ProjectEquipmentWithQuotations,
  SupplierQuotation,
  ProjectEmail,

  // DTOs (Data Transfer Objects)
  CreateEventProjectData,
  UpdateEventProjectData,
  AddTeamMemberData,
  RequestEquipmentQuotesData,
  SubmitQuotationData,

  // Status types
  ProjectStatus,
  TeamMemberStatus,
  EquipmentStatus,
  QuotationStatus,
  EmailRecipientType,
  EmailType,
  EmailStatus,

  // Business types
  ProfitMargin,

  // Filters & Pagination
  EventProjectFilters,
  EventProjectListResponse,
} from './event-project';

export {
  // Helper functions
  getProfitMargin,
  calculateHRXPrice,
  calculateProfit,
  canEditProject,
  canCancelProject,
  getNextAllowedStatuses,

  // Labels
  PROJECT_STATUS_LABELS,
  TEAM_STATUS_LABELS,
  EQUIPMENT_STATUS_LABELS,
  QUOTATION_STATUS_LABELS,
} from './event-project';

// =====================================================
// Quote Types (DEPRECATED - Use EventProject instead)
// =====================================================

export type {
  QuoteRequest,
  QuoteRequestItem,
  QuoteRequestWithDetails,
  QuoteRequestSummary,
  SupplierQuote,
  QuoteEmail,
  CreateQuoteRequestData,
  SendQuoteRequestBody,
} from './quote';

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
