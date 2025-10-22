// =============================================
// TIPOS: Sistema de Orçamentos
// =============================================

// Status possíveis para solicitação de orçamento
export type QuoteRequestStatus = 'draft' | 'sent' | 'analyzing' | 'finalized' | 'cancelled';

// Status possíveis para itens
export type QuoteItemStatus = 'pending' | 'quoted' | 'assigned' | 'confirmed';

// Status possíveis para cotações de fornecedores
export type SupplierQuoteStatus = 'pending' | 'sent' | 'received' | 'accepted' | 'rejected';

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
// INTERFACES
// =============================================

// Solicitação de orçamento
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

// Orçamento do fornecedor
export interface SupplierQuote {
  id: string;
  quote_request_id: string;
  quote_request_item_id?: string;
  supplier_id: string;

  // Preços
  supplier_price: number;  // Custo do fornecedor
  hrx_price: number;       // Preço com margem
  profit_margin_applied: ProfitMargin;
  profit_amount: number;   // Lucro em R$

  // Detalhes
  description?: string;
  notes?: string;
  availability_confirmed: boolean;

  // Status
  status: SupplierQuoteStatus;

  // Timestamps
  sent_at?: string;
  received_at?: string;
  accepted_at?: string;
  rejected_at?: string;
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

// Criar nova solicitação de orçamento
export interface CreateQuoteRequestData {
  client_name: string;
  client_email?: string;
  client_phone?: string;
  event_date?: string;
  event_type?: string;
  event_location?: string;
  description?: string;
  is_urgent: boolean;
  items: CreateQuoteItemData[];
}

// Criar item de orçamento
export interface CreateQuoteItemData {
  item_type: QuoteItemType;
  category: string;
  subcategory?: string;
  name: string;
  description?: string;
  quantity: number;
  duration_days: number;
  specifications?: Record<string, any>;
}

// Criar cotação de fornecedor
export interface CreateSupplierQuoteData {
  quote_request_id: string;
  quote_request_item_id?: string;
  supplier_id: string;
  supplier_price: number;
  description?: string;
  notes?: string;
}

// Atualizar cotação de fornecedor
export interface UpdateSupplierQuoteData {
  supplier_price?: number;
  description?: string;
  notes?: string;
  availability_confirmed?: boolean;
  status?: SupplierQuoteStatus;
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

// Solicitação completa (com itens e cotações)
export interface QuoteRequestWithDetails extends QuoteRequest {
  items: QuoteRequestItem[];
  quotes: SupplierQuoteWithSupplier[];
  emails: QuoteEmail[];
}

// Cotação com informações do fornecedor
export interface SupplierQuoteWithSupplier extends SupplierQuote {
  supplier: {
    id: string;
    company_name: string;
    contact_name: string;
    email: string;
    phone: string;
  };
}

// =============================================
// TIPOS PARA EMAILS
// =============================================

// Dados para email de solicitação de orçamento
export interface QuoteRequestEmailData {
  supplierName: string;
  supplierEmail: string;
  quoterequestId: string;
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

// Calcular preço HRX com margem
export function calculateHRXPrice(supplierPrice: number, margin: ProfitMargin): number {
  return supplierPrice * (1 + margin / 100);
}

// Calcular lucro
export function calculateProfit(hrxPrice: number, supplierPrice: number): number {
  return hrxPrice - supplierPrice;
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
