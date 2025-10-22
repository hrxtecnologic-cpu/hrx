/**
 * Contractor Types
 *
 * Tipos TypeScript para contratantes
 */

// =====================================================
// Status Types
// =====================================================

export type ContractorStatus = 'pending' | 'approved' | 'rejected';

export type ContractorType = 'individual' | 'company';

// =====================================================
// Contractor Interface
// =====================================================

export interface Contractor {
  // IDs
  id: string;
  userId: string;
  clerkId: string;

  // Dados Básicos
  type: ContractorType;

  // Para Pessoa Física
  fullName?: string;
  cpf?: string;

  // Para Empresa
  companyName?: string;
  cnpj?: string;
  tradingName?: string;

  // Contato
  email: string;
  phone: string;

  // Endereço
  street: string;
  number?: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  cep: string;

  // Documentos (URLs)
  documents?: {
    cpf?: string;
    rg?: string;
    cnpj?: string;
    contractSocial?: string;
    proofOfAddress?: string;
  };

  // Status
  status: ContractorStatus;
  approvedBy?: string | null;
  approvedAt?: string | null;
  rejectedBy?: string | null;
  rejectedAt?: string | null;
  rejectionReason?: string | null;

  // Preferências
  acceptsNotifications: boolean;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// =====================================================
// Partial Types
// =====================================================

export type ContractorCreateInput = Omit<
  Contractor,
  'id' | 'userId' | 'status' | 'approvedBy' | 'approvedAt' | 'rejectedBy' | 'rejectedAt' | 'createdAt' | 'updatedAt'
>;

export type ContractorUpdateInput = Partial<
  Omit<Contractor, 'id' | 'userId' | 'clerkId' | 'createdAt'>
>;

// =====================================================
// Stats
// =====================================================

export interface ContractorStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}
