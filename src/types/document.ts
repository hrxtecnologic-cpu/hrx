/**
 * Document Types
 *
 * Tipos TypeScript para documentos e validações
 */

import { DocumentType, DocumentValidationStatus } from './professional';

// =====================================================
// Document Requirement Types
// =====================================================

export interface DocumentRequirement {
  type: DocumentType;
  label: string;
  required: boolean;
  description?: string;
  acceptedFormats?: string[];
  maxSize?: number; // em MB
  validityRequired?: boolean; // Se requer campo de validade
}

export type CategoryDocumentRequirements = Record<string, DocumentRequirement[]>;

// =====================================================
// Document Upload Types
// =====================================================

export interface DocumentUpload {
  file: File;
  type: DocumentType;
  preview?: string;
}

export interface DocumentUploadProgress {
  type: DocumentType;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

// =====================================================
// Document Validation Types
// =====================================================

export interface DocumentValidationRequest {
  professionalId: string;
  documentType: DocumentType;
  status: DocumentValidationStatus;
  message?: string;
  rejectionReason?: string;
}

export interface DocumentValidationResponse {
  success: boolean;
  message?: string;
  validation?: {
    status: DocumentValidationStatus;
    validatedBy: string;
    validatedAt: string;
  };
}

// =====================================================
// Document View Types
// =====================================================

export interface DocumentView {
  type: DocumentType;
  url: string;
  label: string;
  validationStatus?: DocumentValidationStatus;
  validationMessage?: string;
  rejectionReason?: string;
  isRequired: boolean;
  hasValidity?: boolean; // Se tem campo de validade associado
  validity?: string | null; // Data de validade
  validityField?: string; // Nome do campo (ex: 'cnhValidity')
}

// =====================================================
// Constants
// =====================================================

export const DOCUMENT_LABELS: Record<DocumentType, string> = {
  rg_front: 'RG (Frente)',
  rg_back: 'RG (Verso)',
  cpf: 'CPF',
  proof_of_address: 'Comprovante de Residência',
  cnh_photo: 'CNH (Frente)',
  cnh_back: 'CNH (Verso)',
  cnv_photo: 'CNV',
  nr10_certificate: 'Certificado NR10',
  nr35_certificate: 'Certificado NR35',
  drt_photo: 'DRT',
  profile_photo: 'Foto de Perfil',
};

export const ACCEPTED_IMAGE_FORMATS = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
export const ACCEPTED_PDF_FORMATS = ['application/pdf'];
export const MAX_FILE_SIZE_MB = 10;

// =====================================================
// Document Requirements by Category
// =====================================================

export const DOCUMENT_REQUIREMENTS_BY_CATEGORY: CategoryDocumentRequirements = {
  'Motorista': [
    {
      type: 'rg_front',
      label: 'RG (Frente)',
      required: true,
      acceptedFormats: ACCEPTED_IMAGE_FORMATS,
      maxSize: MAX_FILE_SIZE_MB,
    },
    {
      type: 'rg_back',
      label: 'RG (Verso)',
      required: true,
      acceptedFormats: ACCEPTED_IMAGE_FORMATS,
      maxSize: MAX_FILE_SIZE_MB,
    },
    {
      type: 'cpf',
      label: 'CPF',
      required: true,
      acceptedFormats: ACCEPTED_IMAGE_FORMATS,
      maxSize: MAX_FILE_SIZE_MB,
    },
    {
      type: 'proof_of_address',
      label: 'Comprovante de Residência',
      required: true,
      acceptedFormats: [...ACCEPTED_IMAGE_FORMATS, ...ACCEPTED_PDF_FORMATS],
      maxSize: MAX_FILE_SIZE_MB,
    },
    {
      type: 'cnh_photo',
      label: 'CNH (Frente)',
      required: true,
      acceptedFormats: ACCEPTED_IMAGE_FORMATS,
      maxSize: MAX_FILE_SIZE_MB,
      validityRequired: true,
    },
    {
      type: 'cnh_back',
      label: 'CNH (Verso)',
      required: false,
      acceptedFormats: ACCEPTED_IMAGE_FORMATS,
      maxSize: MAX_FILE_SIZE_MB,
    },
    {
      type: 'profile_photo',
      label: 'Foto de Perfil',
      required: false,
      acceptedFormats: ACCEPTED_IMAGE_FORMATS,
      maxSize: 5,
    },
  ],
  'Segurança': [
    {
      type: 'rg_front',
      label: 'RG (Frente)',
      required: true,
      acceptedFormats: ACCEPTED_IMAGE_FORMATS,
      maxSize: MAX_FILE_SIZE_MB,
    },
    {
      type: 'rg_back',
      label: 'RG (Verso)',
      required: true,
      acceptedFormats: ACCEPTED_IMAGE_FORMATS,
      maxSize: MAX_FILE_SIZE_MB,
    },
    {
      type: 'cpf',
      label: 'CPF',
      required: true,
      acceptedFormats: ACCEPTED_IMAGE_FORMATS,
      maxSize: MAX_FILE_SIZE_MB,
    },
    {
      type: 'proof_of_address',
      label: 'Comprovante de Residência',
      required: true,
      acceptedFormats: [...ACCEPTED_IMAGE_FORMATS, ...ACCEPTED_PDF_FORMATS],
      maxSize: MAX_FILE_SIZE_MB,
    },
    {
      type: 'cnv_photo',
      label: 'CNV (Carteira Nacional de Vigilante)',
      required: true,
      acceptedFormats: ACCEPTED_IMAGE_FORMATS,
      maxSize: MAX_FILE_SIZE_MB,
      validityRequired: true,
    },
    {
      type: 'profile_photo',
      label: 'Foto de Perfil',
      required: false,
      acceptedFormats: ACCEPTED_IMAGE_FORMATS,
      maxSize: 5,
    },
  ],
  'Eletricista': [
    {
      type: 'rg_front',
      label: 'RG (Frente)',
      required: true,
      acceptedFormats: ACCEPTED_IMAGE_FORMATS,
      maxSize: MAX_FILE_SIZE_MB,
    },
    {
      type: 'rg_back',
      label: 'RG (Verso)',
      required: true,
      acceptedFormats: ACCEPTED_IMAGE_FORMATS,
      maxSize: MAX_FILE_SIZE_MB,
    },
    {
      type: 'cpf',
      label: 'CPF',
      required: true,
      acceptedFormats: ACCEPTED_IMAGE_FORMATS,
      maxSize: MAX_FILE_SIZE_MB,
    },
    {
      type: 'proof_of_address',
      label: 'Comprovante de Residência',
      required: true,
      acceptedFormats: [...ACCEPTED_IMAGE_FORMATS, ...ACCEPTED_PDF_FORMATS],
      maxSize: MAX_FILE_SIZE_MB,
    },
    {
      type: 'nr10_certificate',
      label: 'Certificado NR10',
      required: true,
      acceptedFormats: [...ACCEPTED_IMAGE_FORMATS, ...ACCEPTED_PDF_FORMATS],
      maxSize: MAX_FILE_SIZE_MB,
      validityRequired: true,
    },
    {
      type: 'profile_photo',
      label: 'Foto de Perfil',
      required: false,
      acceptedFormats: ACCEPTED_IMAGE_FORMATS,
      maxSize: 5,
    },
  ],
  'Rigger': [
    {
      type: 'rg_front',
      label: 'RG (Frente)',
      required: true,
      acceptedFormats: ACCEPTED_IMAGE_FORMATS,
      maxSize: MAX_FILE_SIZE_MB,
    },
    {
      type: 'rg_back',
      label: 'RG (Verso)',
      required: true,
      acceptedFormats: ACCEPTED_IMAGE_FORMATS,
      maxSize: MAX_FILE_SIZE_MB,
    },
    {
      type: 'cpf',
      label: 'CPF',
      required: true,
      acceptedFormats: ACCEPTED_IMAGE_FORMATS,
      maxSize: MAX_FILE_SIZE_MB,
    },
    {
      type: 'proof_of_address',
      label: 'Comprovante de Residência',
      required: true,
      acceptedFormats: [...ACCEPTED_IMAGE_FORMATS, ...ACCEPTED_PDF_FORMATS],
      maxSize: MAX_FILE_SIZE_MB,
    },
    {
      type: 'nr35_certificate',
      label: 'Certificado NR35',
      required: true,
      acceptedFormats: [...ACCEPTED_IMAGE_FORMATS, ...ACCEPTED_PDF_FORMATS],
      maxSize: MAX_FILE_SIZE_MB,
      validityRequired: true,
    },
    {
      type: 'profile_photo',
      label: 'Foto de Perfil',
      required: false,
      acceptedFormats: ACCEPTED_IMAGE_FORMATS,
      maxSize: 5,
    },
  ],
  // Categorias que requerem apenas documentos básicos
  'Técnico de Iluminação': [
    {
      type: 'rg_front',
      label: 'RG (Frente)',
      required: true,
      acceptedFormats: ACCEPTED_IMAGE_FORMATS,
      maxSize: MAX_FILE_SIZE_MB,
    },
    {
      type: 'rg_back',
      label: 'RG (Verso)',
      required: true,
      acceptedFormats: ACCEPTED_IMAGE_FORMATS,
      maxSize: MAX_FILE_SIZE_MB,
    },
    {
      type: 'cpf',
      label: 'CPF',
      required: true,
      acceptedFormats: ACCEPTED_IMAGE_FORMATS,
      maxSize: MAX_FILE_SIZE_MB,
    },
    {
      type: 'proof_of_address',
      label: 'Comprovante de Residência',
      required: true,
      acceptedFormats: [...ACCEPTED_IMAGE_FORMATS, ...ACCEPTED_PDF_FORMATS],
      maxSize: MAX_FILE_SIZE_MB,
    },
    {
      type: 'profile_photo',
      label: 'Foto de Perfil',
      required: false,
      acceptedFormats: ACCEPTED_IMAGE_FORMATS,
      maxSize: 5,
    },
  ],
};

// Usar requisitos básicos para categorias não especificadas
export const BASIC_DOCUMENT_REQUIREMENTS: DocumentRequirement[] = DOCUMENT_REQUIREMENTS_BY_CATEGORY['Técnico de Iluminação'];

// =====================================================
// Helper Functions
// =====================================================

/**
 * Obtém requisitos de documentos para categorias selecionadas
 */
export function getDocumentRequirements(categories: string[]): DocumentRequirement[] {
  const allRequirements = new Map<DocumentType, DocumentRequirement>();

  categories.forEach(category => {
    const requirements = DOCUMENT_REQUIREMENTS_BY_CATEGORY[category] || BASIC_DOCUMENT_REQUIREMENTS;

    requirements.forEach(req => {
      const existing = allRequirements.get(req.type);
      // Se já existe, manter como required se alguma categoria exigir
      if (existing) {
        existing.required = existing.required || req.required;
      } else {
        allRequirements.set(req.type, { ...req });
      }
    });
  });

  return Array.from(allRequirements.values());
}

/**
 * Valida se documentos obrigatórios foram fornecidos
 */
export function validateRequiredDocuments(
  categories: string[],
  documents: Record<string, string>
): { valid: boolean; missing: DocumentType[] } {
  const requirements = getDocumentRequirements(categories);
  const missing: DocumentType[] = [];

  requirements.forEach(req => {
    if (req.required && !documents[req.type]) {
      missing.push(req.type);
    }
  });

  return {
    valid: missing.length === 0,
    missing,
  };
}
