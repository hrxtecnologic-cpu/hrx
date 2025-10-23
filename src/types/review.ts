/**
 * =====================================================
 * TYPES: Sistema de Avaliações
 * =====================================================
 * Status: BASE PREPARADA (aguardando implementação)
 * =====================================================
 */

// =====================================================
// Professional Reviews
// =====================================================

export interface ProfessionalReview {
  id: string;
  project_id: string;
  team_member_id: string;
  professional_id: string;

  // Avaliação
  rating: number; // 1-5
  comment?: string;

  // Critérios específicos
  punctuality_rating?: number; // 1-5
  professionalism_rating?: number; // 1-5
  quality_rating?: number; // 1-5
  communication_rating?: number; // 1-5

  // Recomendação
  would_hire_again: boolean;

  // Controle
  reviewed_by?: string;
  is_visible: boolean;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface CreateProfessionalReviewData {
  project_id: string;
  team_member_id: string;
  professional_id: string;
  rating: number;
  comment?: string;
  punctuality_rating?: number;
  professionalism_rating?: number;
  quality_rating?: number;
  communication_rating?: number;
  would_hire_again?: boolean;
}

export interface ProfessionalReviewStats {
  professional_id: string;
  full_name: string;
  total_reviews: number;
  avg_rating: number;
  avg_punctuality: number;
  avg_professionalism: number;
  avg_quality: number;
  avg_communication: number;
  would_hire_again_count: number;
  would_hire_again_percentage: number;
}

// =====================================================
// Supplier Reviews
// =====================================================

export interface SupplierReview {
  id: string;
  project_id: string;
  quotation_id: string;
  supplier_id: string;

  // Avaliação
  rating: number; // 1-5
  comment?: string;

  // Critérios específicos
  delivery_rating?: number; // 1-5
  equipment_quality_rating?: number; // 1-5
  service_rating?: number; // 1-5
  price_value_rating?: number; // 1-5

  // Recomendação
  would_hire_again: boolean;

  // Controle
  reviewed_by?: string;
  is_visible: boolean;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface CreateSupplierReviewData {
  project_id: string;
  quotation_id: string;
  supplier_id: string;
  rating: number;
  comment?: string;
  delivery_rating?: number;
  equipment_quality_rating?: number;
  service_rating?: number;
  price_value_rating?: number;
  would_hire_again?: boolean;
}

export interface SupplierReviewStats {
  supplier_id: string;
  company_name: string;
  total_reviews: number;
  avg_rating: number;
  avg_delivery: number;
  avg_quality: number;
  avg_service: number;
  avg_price_value: number;
  would_hire_again_count: number;
  would_hire_again_percentage: number;
}

// =====================================================
// Common Types
// =====================================================

export type ReviewRating = 1 | 2 | 3 | 4 | 5;

export interface ReviewWithProject {
  id: string;
  project_number: string;
  event_name: string;
  rating: number;
  comment?: string;
  would_hire_again: boolean;
  created_at: string;
}

// =====================================================
// Helper Constants
// =====================================================

export const RATING_LABELS = {
  1: 'Muito Ruim',
  2: 'Ruim',
  3: 'Regular',
  4: 'Bom',
  5: 'Excelente',
} as const;

export const REVIEW_CRITERIA_LABELS = {
  // Professional
  punctuality: 'Pontualidade',
  professionalism: 'Profissionalismo',
  quality: 'Qualidade',
  communication: 'Comunicação',

  // Supplier
  delivery: 'Entrega/Retirada',
  equipment_quality: 'Qualidade do Equipamento',
  service: 'Atendimento',
  price_value: 'Custo-Benefício',
} as const;
