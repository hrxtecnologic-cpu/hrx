// =====================================================
// Event Project Types - Unified Architecture
// =====================================================
// Tipos TypeScript para sistema unificado de projetos de eventos
// Espelham as tabelas do banco (migrations 011 e 012)
// =====================================================

// =====================================================
// ENUMS E CONSTANTES
// =====================================================

export type ProfitMargin = 35.00 | 80.00;

export type ProjectStatus =
  | 'new'           // Novo (acabou de chegar)
  | 'analyzing'     // Analisando (admin verificando)
  | 'quoting'       // Cotando (enviando para fornecedores)
  | 'quoted'        // Cotado (recebeu cotações)
  | 'proposed'      // Proposta enviada ao cliente
  | 'approved'      // Aprovado pelo cliente
  | 'in_execution'  // Em execução
  | 'completed'     // Concluído
  | 'cancelled';    // Cancelado

export type TeamMemberStatus =
  | 'planned'       // Planejado (ainda não confirmado)
  | 'invited'       // Convidado (enviado convite)
  | 'confirmed'     // Confirmado (profissional aceitou)
  | 'rejected'      // Rejeitado (profissional recusou)
  | 'allocated'     // Alocado (confirmado e pronto para trabalhar)
  | 'working'       // Trabalhando (evento em andamento)
  | 'completed'     // Concluído
  | 'cancelled';    // Cancelado

export type EquipmentStatus =
  | 'requested'     // Solicitado (ainda não enviado para fornecedores)
  | 'quoting'       // Cotando (enviado para fornecedores)
  | 'quoted'        // Cotado (recebeu cotações)
  | 'selected'      // Selecionado (fornecedor escolhido)
  | 'confirmed'     // Confirmado (fornecedor confirmou disponibilidade)
  | 'delivered'     // Entregue
  | 'returned'      // Devolvido
  | 'cancelled';    // Cancelado

export type QuotationStatus =
  | 'pending'       // Aguardando fornecedor responder
  | 'sent'          // Enviado ao fornecedor
  | 'received'      // Recebido do fornecedor
  | 'accepted'      // Aceito pela HRX
  | 'rejected'      // Rejeitado pela HRX
  | 'expired';      // Expirado (prazo passou)

export type EmailRecipientType =
  | 'client'        // Cliente final
  | 'supplier'      // Fornecedor
  | 'professional'  // Profissional
  | 'hrx_admin'     // Admin HRX
  | 'other';

export type EmailType =
  | 'project_created'     // Projeto criado
  | 'quote_request'       // Solicitação de cotação
  | 'quote_urgent_admin'  // Notificação urgente admin
  | 'quote_received'      // Cotação recebida
  | 'quote_accepted'      // Cotação aceita
  | 'quote_rejected'      // Cotação rejeitada
  | 'proposal_sent'       // Proposta enviada ao cliente
  | 'project_approved'    // Projeto aprovado
  | 'project_reminder'    // Lembrete
  | 'project_completed'   // Projeto concluído
  | 'other';

export type EmailStatus =
  | 'pending'
  | 'sent'
  | 'delivered'
  | 'opened'
  | 'failed';

// =====================================================
// INTERFACE PRINCIPAL: EVENT PROJECT
// =====================================================

export interface EventProject {
  id: string;
  project_number: string;

  // Cliente
  client_name: string;
  client_email?: string | null;
  client_phone?: string | null;
  client_company?: string | null;
  client_cnpj?: string | null;

  // Evento
  event_name: string;
  event_type: string;
  event_description?: string | null;
  event_date?: string | null; // Date ISO string
  start_time?: string | null;
  end_time?: string | null;
  expected_attendance?: number | null;

  // Localização
  venue_name?: string | null;
  venue_address: string;
  venue_city: string;
  venue_state: string;
  venue_zip?: string | null;

  // Business
  is_urgent: boolean;
  profit_margin: ProfitMargin;
  budget_range?: string | null;
  client_budget?: number | null;

  // Status
  status: ProjectStatus;

  // Financeiro (calculados automaticamente)
  total_team_cost: number;
  total_equipment_cost: number;
  total_cost: number;
  total_client_price: number;
  total_profit: number;

  // Observações
  additional_notes?: string | null;
  internal_notes?: string | null;

  // Metadados
  created_by?: string | null;
  created_at: string; // Timestamp ISO string
  updated_at: string;
  quoted_at?: string | null;
  proposed_at?: string | null;
  approved_at?: string | null;
  completed_at?: string | null;

  // Links de migração (temporários)
  migrated_from_contractor_request_id?: string | null;
  migrated_from_quote_request_id?: string | null;
}

// =====================================================
// PROJECT TEAM MEMBER (Profissionais)
// =====================================================

export interface ProjectTeamMember {
  id: string;
  project_id: string;

  // Profissional (da base ou externo)
  professional_id?: string | null;
  external_name?: string | null;

  // Função
  role: string;
  category: string;
  subcategory?: string | null;

  // Quantidade e Duração
  quantity: number;
  duration_days: number;

  // Valores
  daily_rate?: number | null;
  total_cost?: number | null;

  // Status
  status: TeamMemberStatus;

  // Observações
  notes?: string | null;

  // Metadados
  created_at: string;
  updated_at: string;
  invited_at?: string | null;
  confirmed_at?: string | null;
}

// =====================================================
// PROJECT EQUIPMENT (Equipamentos)
// =====================================================

export interface ProjectEquipment {
  id: string;
  project_id: string;

  // Equipamento
  equipment_type: string;
  category: string;
  subcategory?: string | null;
  name: string;
  description?: string | null;

  // Quantidade e Duração
  quantity: number;
  duration_days: number;

  // Custos (estimados/planejados)
  daily_rate?: number | null;
  total_cost?: number | null;

  // Especificações
  specifications: Record<string, any>;

  // Status
  status: EquipmentStatus;

  // Fornecedor selecionado
  selected_supplier_id?: string | null;
  selected_quote_id?: string | null;

  // Observações
  notes?: string | null;

  // Metadados
  created_at: string;
  updated_at: string;
}

// =====================================================
// SUPPLIER QUOTATION (Cotações)
// =====================================================

export interface SupplierQuotation {
  id: string;
  project_id: string;
  supplier_id: string;
  token: string;

  // Items solicitados (JSONB array)
  requested_items: any[]; // Array de equipamentos solicitados

  // Valores
  total_price?: number | null;
  daily_rate?: number | null;
  delivery_fee?: number | null;
  setup_fee?: number | null;

  // Termos
  payment_terms?: string | null;
  delivery_details?: string | null;
  notes?: string | null;

  // Status
  status: QuotationStatus;

  // Prazos
  valid_until?: string | null;

  // Metadados
  created_at: string;
  submitted_at?: string | null;
  responded_at?: string | null;
}

// =====================================================
// PROJECT EMAIL (Log de emails)
// =====================================================

export interface ProjectEmail {
  id: string;
  project_id: string;
  quotation_id?: string | null;

  // Destinatário
  recipient_email: string;
  recipient_name?: string | null;
  recipient_type: EmailRecipientType;

  // Email
  email_type: EmailType;
  subject?: string | null;
  template_used?: string | null;

  // Status
  status: EmailStatus;

  // Resend
  resend_id?: string | null;
  error_message?: string | null;

  // Metadados
  sent_at?: string | null;
  delivered_at?: string | null;
  opened_at?: string | null;
  created_at: string;
}

// =====================================================
// VIEWS DO BANCO (para listagens)
// =====================================================

export interface EventProjectSummary {
  id: string;
  project_number: string;
  client_name: string;
  client_email?: string | null;
  event_name: string;
  event_type: string;
  event_date?: string | null;
  venue_city: string;
  venue_state: string;
  is_urgent: boolean;
  profit_margin: ProfitMargin;
  status: ProjectStatus;
  total_cost: number;
  total_client_price: number;
  total_profit: number;
  created_at: string;
  updated_at: string;

  // Contadores
  team_count: number;
  equipment_count: number;
  quotations_received_count: number;
  quotations_accepted_count: number;
}

export interface EventProjectFull extends EventProject {
  // Agregações de Team
  calculated_team_cost: number;
  total_team_members: number;
  confirmed_team_members: number;

  // Agregações de Equipment
  calculated_equipment_cost: number;
  total_equipment_items: number;
  confirmed_equipment_items: number;
}

// =====================================================
// DTOs (Data Transfer Objects para APIs)
// =====================================================

// Criar novo projeto
export interface CreateEventProjectData {
  // Cliente
  client_name: string;
  client_email?: string;
  client_phone?: string;
  client_company?: string;
  client_cnpj?: string;

  // Evento
  event_name: string;
  event_type: string;
  event_description?: string;
  event_date?: string; // Date ISO string
  start_time?: string;
  end_time?: string;
  expected_attendance?: number;

  // Localização
  venue_name?: string;
  venue_address: string;
  venue_city: string;
  venue_state: string;
  venue_zip?: string;

  // Business
  is_urgent: boolean;
  budget_range?: string;
  client_budget?: number;

  // Observações
  additional_notes?: string;
  internal_notes?: string;

  // Equipe (profissionais necessários)
  team: Omit<ProjectTeamMember, 'id' | 'project_id' | 'created_at' | 'updated_at' | 'invited_at' | 'confirmed_at'>[];

  // Equipamentos necessários
  equipment: Omit<ProjectEquipment, 'id' | 'project_id' | 'status' | 'selected_supplier_id' | 'selected_quote_id' | 'created_at' | 'updated_at'>[];
}

// Atualizar projeto
export interface UpdateEventProjectData {
  // Cliente
  client_name?: string;
  client_email?: string;
  client_phone?: string;
  client_company?: string;
  client_cnpj?: string;

  // Evento
  event_name?: string;
  event_type?: string;
  event_description?: string;
  event_date?: string;
  start_time?: string;
  end_time?: string;
  expected_attendance?: number;

  // Localização
  venue_name?: string;
  venue_address?: string;
  venue_city?: string;
  venue_state?: string;
  venue_zip?: string;

  // Business
  is_urgent?: boolean;
  budget_range?: string;
  client_budget?: number;
  status?: ProjectStatus;

  // Observações
  additional_notes?: string;
  internal_notes?: string;
}

// Adicionar membro à equipe
export interface AddTeamMemberData {
  professional_id?: string;
  external_name?: string;
  role: string;
  category: string;
  subcategory?: string;
  quantity: number;
  duration_days: number;
  daily_rate?: number;
  notes?: string;
}

// Solicitar cotações para equipamento
export interface RequestEquipmentQuotesData {
  equipment_id: string;
  supplier_ids: string[];
  deadline: string; // ISO timestamp
}

// Responder cotação (fornecedor)
export interface SubmitQuotationData {
  quotation_id: string;
  supplier_price: number;
  availability_confirmed: boolean;
  delivery_date?: string;
  pickup_date?: string;
  notes?: string;
}

// =====================================================
// HELPERS E UTILITÁRIOS
// =====================================================

// Calcular margem de lucro baseado na urgência
export function getProfitMargin(isUrgent: boolean): ProfitMargin {
  return isUrgent ? 80.00 : 35.00;
}

// Calcular preço HRX baseado no custo e margem
export function calculateHRXPrice(cost: number, margin: ProfitMargin): number {
  return cost * (1 + margin / 100);
}

// Calcular lucro
export function calculateProfit(hrxPrice: number, cost: number): number {
  return hrxPrice - cost;
}

// Verificar se status permite edição
export function canEditProject(status: ProjectStatus): boolean {
  return ['new', 'analyzing', 'quoting'].includes(status);
}

// Verificar se status permite cancelamento
export function canCancelProject(status: ProjectStatus): boolean {
  return !['completed', 'cancelled'].includes(status);
}

// Obter próximo status permitido
export function getNextAllowedStatuses(currentStatus: ProjectStatus): ProjectStatus[] {
  const transitions: Record<ProjectStatus, ProjectStatus[]> = {
    new: ['analyzing', 'cancelled'],
    analyzing: ['quoting', 'cancelled'],
    quoting: ['quoted', 'cancelled'],
    quoted: ['proposed', 'quoting', 'cancelled'],
    proposed: ['approved', 'cancelled'],
    approved: ['in_execution', 'cancelled'],
    in_execution: ['completed', 'cancelled'],
    completed: [],
    cancelled: [],
  };

  return transitions[currentStatus] || [];
}

// Labels em português para status
export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  new: 'Novo',
  analyzing: 'Analisando',
  quoting: 'Cotando',
  quoted: 'Cotado',
  proposed: 'Proposta Enviada',
  approved: 'Aprovado',
  in_execution: 'Em Execução',
  completed: 'Concluído',
  cancelled: 'Cancelado',
};

export const TEAM_STATUS_LABELS: Record<TeamMemberStatus, string> = {
  planned: 'Planejado',
  invited: 'Convidado',
  confirmed: 'Confirmado',
  rejected: 'Rejeitado',
  allocated: 'Alocado',
  working: 'Trabalhando',
  completed: 'Concluído',
  cancelled: 'Cancelado',
};

export const EQUIPMENT_STATUS_LABELS: Record<EquipmentStatus, string> = {
  requested: 'Solicitado',
  quoting: 'Cotando',
  quoted: 'Cotado',
  selected: 'Selecionado',
  confirmed: 'Confirmado',
  delivered: 'Entregue',
  returned: 'Devolvido',
  cancelled: 'Cancelado',
};

export const QUOTATION_STATUS_LABELS: Record<QuotationStatus, string> = {
  pending: 'Pendente',
  sent: 'Enviado',
  received: 'Recebido',
  accepted: 'Aceito',
  rejected: 'Rejeitado',
  expired: 'Expirado',
};

// =====================================================
// TYPES COMPOSTOS (com relacionamentos populados)
// =====================================================

export interface EventProjectWithDetails extends EventProject {
  team: ProjectTeamMember[];
  equipment: ProjectEquipment[];
  quotations: SupplierQuotation[];
  emails: ProjectEmail[];
}

export interface ProjectEquipmentWithQuotations extends ProjectEquipment {
  quotations: SupplierQuotation[];
  selected_supplier?: {
    id: string;
    company_name: string;
    contact_name: string;
    email: string;
    phone: string;
  };
}

export interface ProjectTeamMemberWithProfessional extends ProjectTeamMember {
  professional?: {
    id: string;
    full_name: string;
    email: string;
    phone: string;
    categories: string[];
  };
}

// =====================================================
// FILTROS E PAGINAÇÃO
// =====================================================

export interface EventProjectFilters {
  status?: ProjectStatus | ProjectStatus[];
  is_urgent?: boolean;
  client_name?: string;
  event_type?: string;
  event_date_from?: string;
  event_date_to?: string;
  venue_city?: string;
  venue_state?: string;
  created_after?: string;
  created_before?: string;
}

export interface PaginationParams {
  limit?: number;
  offset?: number;
}

export interface SortParams {
  field: keyof EventProject;
  direction: 'asc' | 'desc';
}

export interface EventProjectListResponse {
  projects: EventProjectSummary[];
  total: number;
  limit: number;
  offset: number;
}
