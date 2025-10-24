// =============================================
// TIPOS: Sistema de Orçamentos
// Atualizado para refletir o schema real do banco (supplier_quotations)
// =============================================

// Status possíveis para solicitação de orçamento
export type QuoteRequestStatus = 'draft' | 'sent' | 'analyzing' | 'finalized' | 'cancelled';

// Status possíveis para itens
export type QuoteItemStatus = 'pending' | 'quoted' | 'assigned' | 'confirmed';

// Status possíveis para cotações de fornecedores (conforme atual.sql)
export type SupplierQuotationStatus = 'pending' | 'submitted' | 'accepted' | 'rejected' | 'expired';

// Tipo de item
export type QuoteItemType = 'equipment' | 'professional' | 'service' | 'other';

// Tipo de email
export type QuoteEmailType =
  | 'quote_request'        // Solicitação para fornecedor
  | 'quote_urgent_admin'   // Notificação urgente para admin
  | 'quote_accepted'       // Orçamento aceito
  | 'quote_rejected'       // Orçamento recusado
  | 'quote_reminder';      // Lembrete

// Status de email
export type QuoteEmailStatus = 'pending' | 'sent' | 'delivered' | 'failed';

// Margem de lucro (35% normal, 80% urgente)
export type ProfitMargin = 35.00 | 80.00;

// =============================================
// INTERFACES - REFLETEM SCHEMA REAL DO BANCO
// =============================================

// Item solicitado dentro de uma cotação (JSONB no banco)
export interface RequestedItem {
  equipment_id?: string;
  name: string;
  category: string;
  subcategory?: string;
  quantity: number;
  duration_days: number;
  description?: string;
  specifications?: Record<string, any>;
}

// Cotação de fornecedor (tabela supplier_quotations)
export interface SupplierQuotation {
  id: string;
  project_id: string;
  supplier_id: string;
  token: string;

  // Items solicitados (JSONB array)
  requested_items: RequestedItem[];

  // Status (conforme banco)
  status: SupplierQuotationStatus;

  // Preços (campos que EXISTEM no banco)
  total_price?: number;
  daily_rate?: number;
  delivery_fee?: number;
  setup_fee?: number;

  // Detalhes
  payment_terms?: string;
  delivery_details?: string;
  notes?: string;

  // Timestamps
  valid_until?: string;
  created_at: string;
  submitted_at?: string;
  responded_at?: string;
}

// Cotação com informações do fornecedor
export interface SupplierQuotationWithSupplier extends SupplierQuotation {
  supplier: {
    id: string;
    company_name: string;
    contact_name: string;
    email: string;
    phone: string;
  };
}

// Cotação com informações do projeto
export interface SupplierQuotationWithProject extends SupplierQuotation {
  project: {
    id: string;
    project_number: string;
    event_name: string;
    event_date?: string;
    client_name: string;
  };
}

// =============================================
// INTERFACES LEGADAS (para compatibilidade)
// =============================================

// Solicitação de orçamento (QuoteRequest - tabela antiga/externa)
export interface QuoteRequest {
  id: string;

  // Informações do cliente/evento
  client_name: string;
  client_email?: string;
  client_phone?: string;
  event_date?: string;
  event_type?: string;
  event_location?: string;
  description?: string;

  // Urgência e margem
  is_urgent: boolean;
  profit_margin: ProfitMargin;

  // Status
  status: QuoteRequestStatus;

  // Valores totais
  total_supplier_cost: number;
  total_client_price: number;
  total_profit: number;

  // Metadados
  created_by?: string;
  created_at: string;
  updated_at: string;
  finalized_at?: string;
}

// Item da solicitação
export interface QuoteRequestItem {
  id: string;
  quote_request_id: string;

  // Tipo e categoria
  item_type: QuoteItemType;
  category: string;
  subcategory?: string;
  name: string;
  description?: string;

  // Quantidade e duração
  quantity: number;
  duration_days: number;

  // Especificações técnicas
  specifications?: Record<string, any>;

  // Status
  status: QuoteItemStatus;

  created_at: string;
  updated_at: string;
}

// Email de orçamento
export interface QuoteEmail {
  id: string;
  quote_request_id: string;
  supplier_quote_id?: string;

  // Destinatário
  recipient_email: string;
  recipient_name?: string;

  // Tipo e status
  email_type: QuoteEmailType;
  status: QuoteEmailStatus;

  // Resend
  resend_id?: string;
  error_message?: string;

  sent_at?: string;
  delivered_at?: string;
  created_at: string;
}

// =============================================
// TIPOS PARA FORMULÁRIOS E REQUESTS
// =============================================

// Criar nova cotação de fornecedor (dados do formulário público)
export interface CreateSupplierQuotationData {
  token: string;
  total_price: number;
  daily_rate?: number;
  delivery_fee?: number;
  setup_fee?: number;
  payment_terms?: string;
  delivery_details?: string;
  notes?: string;
}

// Atualizar cotação de fornecedor
export interface UpdateSupplierQuotationData {
  total_price?: number;
  daily_rate?: number;
  delivery_fee?: number;
  setup_fee?: number;
  payment_terms?: string;
  delivery_details?: string;
  notes?: string;
  status?: SupplierQuotationStatus;
}

// Solicitar cotação para fornecedor (usado pelo admin)
export interface RequestQuotationData {
  project_id: string;
  supplier_id: string;
  requested_items: RequestedItem[];
  valid_until: string;
}

// =============================================
// TIPOS PARA VIEWS E RESUMOS
// =============================================

// Resumo de solicitação (com estatísticas)
export interface QuoteRequestSummary extends QuoteRequest {
  total_items: number;
  total_quotes: number;
  accepted_quotes: number;
}

// Solicitação completa (com itens e cotações) - LEGADO
export interface QuoteRequestWithDetails extends QuoteRequest {
  items: QuoteRequestItem[];
  quotes: SupplierQuotationWithSupplier[];
  emails: QuoteEmail[];
}

// =============================================
// TIPOS PARA EMAILS
// =============================================

// Dados para email de solicitação de orçamento
export interface QuoteRequestEmailData {
  supplierName: string;
  supplierEmail: string;
  quoteRequestId: string;
  clientName: string;
  eventDate?: string;
  eventType?: string;
  eventLocation?: string;
  items: {
    name: string;
    quantity: number;
    duration_days: number;
    description?: string;
  }[];
  deadline: string; // Data limite para resposta
}

// Dados para email urgente ao admin
export interface UrgentQuoteAdminEmailData {
  adminEmail: string;
  quoteRequestId: string;
  clientName: string;
  eventDate?: string;
  eventType?: string;
  totalItems: number;
  description?: string;
}

// Dados para email de orçamento aceito
export interface QuoteAcceptedEmailData {
  supplierName: string;
  supplierEmail: string;
  quoteRequestId: string;
  clientName: string;
  eventDate?: string;
  acceptedPrice: number;
  items: string[];
}

// Dados para email de orçamento recusado
export interface QuoteRejectedEmailData {
  supplierName: string;
  supplierEmail: string;
  quoteRequestId: string;
  clientName: string;
  reason?: string;
}

// =============================================
// UTILITÁRIOS
// =============================================

// Calcular margem de lucro
export function getProfitMargin(isUrgent: boolean): ProfitMargin {
  return isUrgent ? 80.00 : 35.00;
}

// Calcular preço para cliente (com margem)
export function calculateClientPrice(supplierPrice: number, margin: ProfitMargin): number {
  return supplierPrice * (1 + margin / 100);
}

// Calcular lucro
export function calculateProfit(clientPrice: number, supplierPrice: number): number {
  return clientPrice - supplierPrice;
}

// Calcular preço total de uma cotação
export function calculateQuotationTotal(quotation: Partial<SupplierQuotation>): number {
  const base = quotation.total_price || 0;
  const delivery = quotation.delivery_fee || 0;
  const setup = quotation.setup_fee || 0;
  return base + delivery + setup;
}

// Formatar valores para exibição
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

// Verificar se é urgente com base na data do evento
export function isEventUrgent(eventDate?: string): boolean {
  if (!eventDate) return false;

  const event = new Date(eventDate);
  const today = new Date();
  const diffDays = Math.ceil((event.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  // Urgente se faltam 7 dias ou menos
  return diffDays <= 7;
}

// Verificar se cotação está expirada
export function isQuotationExpired(quotation: SupplierQuotation): boolean {
  if (!quotation.valid_until) return false;
  return new Date(quotation.valid_until) < new Date();
}

// Verificar se cotação pode ser respondida
export function canRespondToQuotation(quotation: SupplierQuotation): boolean {
  return quotation.status === 'pending' && !isQuotationExpired(quotation);
}
