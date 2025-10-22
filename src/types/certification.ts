/**
 * Tipos para o Sistema de Certificações Profissionais
 */

// Status de uma certificação
export type CertificationStatus = 'pending' | 'approved' | 'rejected';

// Dados de uma certificação individual
export interface Certification {
  number?: string; // Número do documento (ex: CNH, CNV, etc)
  validity?: string; // Data de validade (YYYY-MM-DD)
  category?: string; // Categoria específica (ex: CNH categoria D)
  document_url?: string; // URL do documento no storage
  status: CertificationStatus;
  approved_at?: string; // Data de aprovação
  approved_by?: string; // UUID do admin que aprovou
  rejection_reason?: string; // Motivo da rejeição (se aplicável)
  notes?: string; // Observações adicionais
}

// Mapa de todas as certificações de um profissional
// Chave: código do documento (ex: 'cnh', 'cnv', 'nr10')
export interface Certifications {
  [key: string]: Certification;
}

// Subcategorias selecionadas organizadas por categoria
// Formato: { "Segurança": ["vigilante", "porteiro"], "Motorista": ["motorista_cat_b"] }
export interface Subcategories {
  [categoryName: string]: string[]; // Array de códigos de subcategorias
}

// Tipos de documentos/certificações disponíveis
export type CertificationType =
  // Habilitações
  | 'cnh'
  | 'cnv'

  // Conselhos profissionais
  | 'coren'
  | 'crm'
  | 'drt'

  // Normas regulamentadoras
  | 'nr10'
  | 'nr23'
  | 'nr35'

  // Cursos e certificados
  | 'curso_primeiros_socorros'
  | 'curso_empilhadeira'
  | 'curso_paleteira'
  | 'certificado_anac'
  | 'certificado_traducao'
  | 'certificado_libras'

  // Outros
  | 'portfolio';

// Configuração de um tipo de certificação
export interface CertificationConfig {
  code: CertificationType;
  label: string;
  requiresNumber: boolean; // Se requer número de documento
  requiresValidity: boolean; // Se requer data de validade
  requiresCategory?: boolean; // Se requer categoria (ex: CNH tem A, B, C, D, E)
  categories?: string[]; // Categorias disponíveis (se aplicável)
  description?: string;
}

// Mapa de configurações de certificações
export const CERTIFICATION_CONFIGS: Record<CertificationType, CertificationConfig> = {
  // Habilitações
  cnh: {
    code: 'cnh',
    label: 'CNH (Carteira Nacional de Habilitação)',
    requiresNumber: true,
    requiresValidity: true,
    requiresCategory: true,
    categories: ['A', 'B', 'C', 'D', 'E', 'AB', 'AC', 'AD', 'AE'],
    description: 'Carteira de motorista'
  },
  cnv: {
    code: 'cnv',
    label: 'CNV (Carteira Nacional de Vigilante)',
    requiresNumber: true,
    requiresValidity: true,
    description: 'Registro profissional de vigilante'
  },

  // Conselhos profissionais
  coren: {
    code: 'coren',
    label: 'COREN (Registro no Conselho de Enfermagem)',
    requiresNumber: true,
    requiresValidity: false,
    description: 'Registro profissional de enfermagem'
  },
  crm: {
    code: 'crm',
    label: 'CRM (Registro no Conselho de Medicina)',
    requiresNumber: true,
    requiresValidity: false,
    description: 'Registro profissional médico'
  },
  drt: {
    code: 'drt',
    label: 'DRT (Registro Profissional)',
    requiresNumber: true,
    requiresValidity: false,
    description: 'Registro profissional para técnicos'
  },

  // Normas regulamentadoras
  nr10: {
    code: 'nr10',
    label: 'NR10 (Trabalho em Eletricidade)',
    requiresNumber: false,
    requiresValidity: true,
    description: 'Certificado de trabalho com eletricidade'
  },
  nr23: {
    code: 'nr23',
    label: 'NR23 (Certificado de Brigadista)',
    requiresNumber: false,
    requiresValidity: true,
    description: 'Certificado de brigadista de incêndio'
  },
  nr35: {
    code: 'nr35',
    label: 'NR35 (Trabalho em Altura)',
    requiresNumber: false,
    requiresValidity: true,
    description: 'Certificado de trabalho em altura'
  },

  // Cursos e certificados
  curso_primeiros_socorros: {
    code: 'curso_primeiros_socorros',
    label: 'Curso de Primeiros Socorros',
    requiresNumber: false,
    requiresValidity: true,
    description: 'Certificado de primeiros socorros'
  },
  curso_empilhadeira: {
    code: 'curso_empilhadeira',
    label: 'Certificado de Operador de Empilhadeira',
    requiresNumber: false,
    requiresValidity: true,
    description: 'Habilitação para operar empilhadeira'
  },
  curso_paleteira: {
    code: 'curso_paleteira',
    label: 'Certificado de Operador de Paleteira',
    requiresNumber: false,
    requiresValidity: true,
    description: 'Habilitação para operar paleteira'
  },
  certificado_anac: {
    code: 'certificado_anac',
    label: 'Certificado ANAC (Piloto de Drone)',
    requiresNumber: true,
    requiresValidity: true,
    description: 'Certificação de piloto de drone'
  },
  certificado_traducao: {
    code: 'certificado_traducao',
    label: 'Certificado de Tradutor/Intérprete',
    requiresNumber: false,
    requiresValidity: false,
    description: 'Certificação de tradução e interpretação'
  },
  certificado_libras: {
    code: 'certificado_libras',
    label: 'Certificado de Intérprete de LIBRAS',
    requiresNumber: false,
    requiresValidity: false,
    description: 'Certificação de interpretação em LIBRAS'
  },

  // Outros
  portfolio: {
    code: 'portfolio',
    label: 'Portfólio',
    requiresNumber: false,
    requiresValidity: false,
    description: 'Portfólio de trabalhos (fotógrafo, chef, DJ, etc)'
  }
};

// Helper para obter configuração de uma certificação
export function getCertificationConfig(code: string): CertificationConfig | undefined {
  return CERTIFICATION_CONFIGS[code as CertificationType];
}

// Helper para verificar se certificação está válida
export function isCertificationValid(cert: Certification): boolean {
  if (cert.status !== 'approved') return false;

  if (!cert.validity) return true; // Sem validade = sempre válida

  const validityDate = new Date(cert.validity);
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Zerar horas para comparação de data

  return validityDate >= today;
}

// Helper para verificar se certificação está próxima do vencimento (30 dias)
export function isCertificationExpiringSoon(cert: Certification): boolean {
  if (!cert.validity || cert.status !== 'approved') return false;

  const validityDate = new Date(cert.validity);
  const today = new Date();
  const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));

  return validityDate <= thirtyDaysFromNow && validityDate >= today;
}

// Helper para obter dias até vencimento
export function getDaysUntilExpiration(cert: Certification): number | null {
  if (!cert.validity) return null;

  const validityDate = new Date(cert.validity);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffTime = validityDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}
