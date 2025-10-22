/**
 * Document Validation Library
 *
 * Centraliza toda a lógica de validação de documentos por categoria
 *
 * Features:
 * - Valida documentos obrigatórios por categoria
 * - Valida campos de validade de documentos
 * - Fornece mensagens de erro descritivas
 * - Suporte para múltiplas categorias (union de requisitos)
 */

import {
  DocumentType,
  DocumentRequirement,
  DOCUMENT_REQUIREMENTS_BY_CATEGORY,
  BASIC_DOCUMENT_REQUIREMENTS,
  DOCUMENT_LABELS,
  getDocumentRequirements as getRequirements
} from '@/types/document';

// =====================================================
// Types
// =====================================================

export interface DocumentValidationError {
  type: DocumentType;
  label: string;
  reason: string;
  field?: string; // Campo de validade associado (ex: 'cnhValidity')
}

export interface DocumentValidationResult {
  valid: boolean;
  errors: DocumentValidationError[];
  warnings?: DocumentValidationError[];
  missingRequired: DocumentType[];
  missingValidity: string[];
}

export interface DocumentValidityFields {
  cnh_validity?: string | null;
  cnv_validity?: string | null;
  nr10_validity?: string | null;
  nr35_validity?: string | null;
  drt_validity?: string | null;
}

// =====================================================
// Validation Functions
// =====================================================

/**
 * Valida documentos e campos de validade para categorias selecionadas
 *
 * @param categories - Categorias selecionadas (ex: ['Motorista', 'Eletricista'])
 * @param documents - Documentos enviados (ex: { rg_front: 'url', cnh_photo: 'url' })
 * @param validityFields - Campos de validade (ex: { cnh_validity: '2025-12-31' })
 * @returns Resultado da validação com erros e avisos
 */
export function validateDocumentsForCategories(
  categories: string[],
  documents: Record<string, string | null | undefined>,
  validityFields?: DocumentValidityFields
): DocumentValidationResult {
  const errors: DocumentValidationError[] = [];
  const warnings: DocumentValidationError[] = [];
  const missingRequired: DocumentType[] = [];
  const missingValidity: string[] = [];

  // Se não há categorias, retornar válido
  if (!categories || categories.length === 0) {
    return {
      valid: true,
      errors: [],
      warnings: [],
      missingRequired: [],
      missingValidity: [],
    };
  }

  // Obter todos os requisitos para as categorias selecionadas
  const requirements = getRequirements(categories);

  // Validar cada requisito
  requirements.forEach(req => {
    const documentUrl = documents[req.type];
    const hasDocument = !!documentUrl && documentUrl.trim().length > 0;

    // Validar documento obrigatório
    if (req.required && !hasDocument) {
      missingRequired.push(req.type);
      errors.push({
        type: req.type,
        label: req.label,
        reason: `Documento obrigatório não enviado`,
      });
    }

    // Validar campo de validade se documento foi enviado
    if (hasDocument && req.validityRequired && validityFields) {
      const validityField = getValidityFieldName(req.type);
      const validityValue = validityFields[validityField as keyof DocumentValidityFields];

      if (!validityValue || validityValue.trim().length === 0) {
        missingValidity.push(validityField);
        errors.push({
          type: req.type,
          label: req.label,
          reason: `Campo de validade obrigatório`,
          field: validityField,
        });
      } else {
        // Validar se data de validade não está expirada
        const validityDate = new Date(validityValue);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (validityDate < today) {
          warnings.push({
            type: req.type,
            label: req.label,
            reason: `Documento expirado (validade: ${formatDate(validityValue)})`,
            field: validityField,
          });
        }
      }
    }

    // Avisar sobre documentos opcionais não enviados (apenas se relevante)
    if (!req.required && !hasDocument && isRecommendedDocument(req.type)) {
      warnings.push({
        type: req.type,
        label: req.label,
        reason: `Documento recomendado não enviado`,
      });
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    missingRequired,
    missingValidity,
  };
}

/**
 * Valida apenas documentos obrigatórios (sem validar validades)
 * Útil para validação rápida no frontend
 */
export function validateRequiredDocuments(
  categories: string[],
  documents: Record<string, string | null | undefined>
): { valid: boolean; missing: DocumentType[]; errors: string[] } {
  const requirements = getRequirements(categories);
  const missing: DocumentType[] = [];
  const errors: string[] = [];

  requirements.forEach(req => {
    const documentUrl = documents[req.type];
    const hasDocument = !!documentUrl && documentUrl.trim().length > 0;

    if (req.required && !hasDocument) {
      missing.push(req.type);
      errors.push(`${req.label} é obrigatório`);
    }
  });

  return {
    valid: missing.length === 0,
    missing,
    errors,
  };
}

/**
 * Valida apenas campos de validade
 */
export function validateValidityFields(
  categories: string[],
  documents: Record<string, string | null | undefined>,
  validityFields: DocumentValidityFields
): { valid: boolean; missing: string[]; errors: string[] } {
  const requirements = getRequirements(categories);
  const missing: string[] = [];
  const errors: string[] = [];

  requirements.forEach(req => {
    const documentUrl = documents[req.type];
    const hasDocument = !!documentUrl && documentUrl.trim().length > 0;

    if (hasDocument && req.validityRequired) {
      const validityField = getValidityFieldName(req.type);
      const validityValue = validityFields[validityField as keyof DocumentValidityFields];

      if (!validityValue || validityValue.trim().length === 0) {
        missing.push(validityField);
        errors.push(`${req.label}: data de validade é obrigatória`);
      }
    }
  });

  return {
    valid: missing.length === 0,
    missing,
    errors,
  };
}

/**
 * Obtém requisitos de documentos para categorias
 * (Re-exporta função de @/types/document para manter API consistente)
 */
export function getDocumentRequirements(categories: string[]): DocumentRequirement[] {
  return getRequirements(categories);
}

/**
 * Gera mensagem de erro amigável para validação de documentos
 */
export function formatDocumentValidationErrors(result: DocumentValidationResult): string {
  if (result.valid) {
    return '';
  }

  const errorMessages: string[] = [];

  if (result.missingRequired.length > 0) {
    errorMessages.push(
      `Documentos obrigatórios faltando: ${result.missingRequired.map(type => DOCUMENT_LABELS[type]).join(', ')}`
    );
  }

  if (result.missingValidity.length > 0) {
    errorMessages.push(
      `Campos de validade obrigatórios: ${result.missingValidity.join(', ')}`
    );
  }

  if (result.errors.length > 0) {
    const otherErrors = result.errors.filter(
      err => !result.missingRequired.includes(err.type) &&
             !result.missingValidity.includes(err.field || '')
    );

    if (otherErrors.length > 0) {
      errorMessages.push(
        ...otherErrors.map(err => `${err.label}: ${err.reason}`)
      );
    }
  }

  return errorMessages.join('; ');
}

/**
 * Gera lista de erros individuais para exibição no frontend
 */
export function formatDocumentValidationErrorList(result: DocumentValidationResult): string[] {
  if (result.valid) {
    return [];
  }

  const errorList: string[] = [];

  result.errors.forEach(err => {
    if (err.field) {
      errorList.push(`${err.label}: ${err.reason} (campo: ${err.field})`);
    } else {
      errorList.push(`${err.label}: ${err.reason}`);
    }
  });

  return errorList;
}

// =====================================================
// Helper Functions
// =====================================================

/**
 * Mapeia tipo de documento para nome do campo de validade
 */
function getValidityFieldName(documentType: DocumentType): string {
  const validityFieldMap: Record<string, string> = {
    cnh_photo: 'cnh_validity',
    cnh_back: 'cnh_validity',
    cnv_photo: 'cnv_validity',
    nr10_certificate: 'nr10_validity',
    nr35_certificate: 'nr35_validity',
    drt_photo: 'drt_validity',
  };

  return validityFieldMap[documentType] || `${documentType}_validity`;
}

/**
 * Verifica se documento é recomendado (mesmo que opcional)
 */
function isRecommendedDocument(documentType: DocumentType): boolean {
  const recommendedDocs: DocumentType[] = ['profile_photo'];
  return recommendedDocs.includes(documentType);
}

/**
 * Formata data para exibição (yyyy-mm-dd → dd/mm/yyyy)
 */
function formatDate(dateString: string): string {
  try {
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  } catch {
    return dateString;
  }
}

/**
 * Verifica se há categorias que requerem documento específico
 */
export function requiresDocument(categories: string[], documentType: DocumentType): boolean {
  const requirements = getRequirements(categories);
  const requirement = requirements.find(req => req.type === documentType);
  return requirement?.required || false;
}

/**
 * Verifica se há categorias que requerem campo de validade para documento
 */
export function requiresValidity(categories: string[], documentType: DocumentType): boolean {
  const requirements = getRequirements(categories);
  const requirement = requirements.find(req => req.type === documentType);
  return requirement?.validityRequired || false;
}

/**
 * Obtém label amigável do documento
 */
export function getDocumentLabel(documentType: DocumentType): string {
  return DOCUMENT_LABELS[documentType] || documentType;
}

// =====================================================
// Constants
// =====================================================

export { DOCUMENT_LABELS, DOCUMENT_REQUIREMENTS_BY_CATEGORY, BASIC_DOCUMENT_REQUIREMENTS };
