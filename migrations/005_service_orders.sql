-- =====================================================
-- Migration 005: Sistema de Ordens de Serviço (OS)
-- =====================================================
-- Sistema completo de OS geradas automaticamente por IA
-- após assinatura de contrato, com distribuição inteligente
-- de tarefas para profissionais e fornecedores
-- =====================================================

-- Tabela principal de Ordens de Serviço
CREATE TABLE IF NOT EXISTS public.service_orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),

  -- Referências
  project_id uuid NOT NULL,
  contract_id uuid NOT NULL,

  -- Identificação
  os_number character varying NOT NULL UNIQUE,
  title character varying NOT NULL,

  -- Status da OS
  status character varying NOT NULL DEFAULT 'pending' CHECK (
    status IN (
      'pending',        -- Aguardando início
      'in_progress',    -- Em andamento
      'completed',      -- Concluída
      'cancelled'       -- Cancelada
    )
  ),

  -- Datas importantes
  event_date date NOT NULL,
  event_start_time time without time zone,
  event_end_time time without time zone,

  -- Briefing gerado pela IA
  ai_briefing text NOT NULL,              -- Briefing completo gerado pela GPT-4
  ai_recommendations text,                 -- Recomendações da IA
  ai_alerts text,                          -- Alertas importantes identificados pela IA

  -- Informações do evento
  venue_name character varying,
  venue_address text NOT NULL,
  venue_city character varying NOT NULL,
  venue_state character varying NOT NULL,
  venue_latitude numeric,
  venue_longitude numeric,

  -- Logística e timing (calculado pela IA + Mapbox)
  estimated_setup_duration_minutes integer, -- Tempo estimado de montagem
  estimated_teardown_duration_minutes integer, -- Tempo estimado de desmontagem
  recommended_arrival_time time without time zone, -- Horário recomendado de chegada
  distance_from_base_km numeric,           -- Distância da sede HRX
  estimated_travel_time_minutes integer,   -- Tempo de deslocamento
  traffic_analysis jsonb DEFAULT '{}'::jsonb, -- Análise de trânsito do Mapbox
  route_details jsonb DEFAULT '{}'::jsonb,    -- Detalhes da rota

  -- Contatos importantes
  client_name character varying NOT NULL,
  client_email character varying,
  client_phone character varying,
  venue_contact_name character varying,
  venue_contact_phone character varying,

  -- Dados estruturados
  team_assignments jsonb DEFAULT '[]'::jsonb, -- Atribuições de profissionais
  equipment_list jsonb DEFAULT '[]'::jsonb,   -- Lista de equipamentos
  supplier_assignments jsonb DEFAULT '[]'::jsonb, -- Atribuições de fornecedores
  checklist jsonb DEFAULT '[]'::jsonb,        -- Checklist de tarefas
  timeline jsonb DEFAULT '[]'::jsonb,         -- Timeline do evento

  -- Observações
  special_instructions text,               -- Instruções especiais
  internal_notes text,                     -- Notas internas HRX

  -- Controle
  generated_by character varying DEFAULT 'ai_system',
  generated_at timestamp with time zone DEFAULT now(),
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  cancelled_at timestamp with time zone,
  cancellation_reason text,

  -- Timestamps
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),

  CONSTRAINT service_orders_pkey PRIMARY KEY (id),
  CONSTRAINT service_orders_project_id_fkey FOREIGN KEY (project_id)
    REFERENCES public.event_projects(id) ON DELETE CASCADE,
  CONSTRAINT service_orders_contract_id_fkey FOREIGN KEY (contract_id)
    REFERENCES public.contracts(id) ON DELETE CASCADE
);

-- Índices para performance
CREATE INDEX idx_service_orders_project_id ON public.service_orders(project_id);
CREATE INDEX idx_service_orders_contract_id ON public.service_orders(contract_id);
CREATE INDEX idx_service_orders_os_number ON public.service_orders(os_number);
CREATE INDEX idx_service_orders_status ON public.service_orders(status);
CREATE INDEX idx_service_orders_event_date ON public.service_orders(event_date);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_service_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_service_orders_updated_at
  BEFORE UPDATE ON public.service_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_service_orders_updated_at();

-- Função para gerar número da OS automaticamente
CREATE OR REPLACE FUNCTION generate_os_number()
RETURNS TRIGGER AS $$
DECLARE
  next_number INTEGER;
  date_prefix TEXT;
BEGIN
  -- Formato: OS-YYYYMMDD-XXXX
  date_prefix := 'OS-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD');

  -- Buscar o próximo número sequencial do dia
  SELECT COALESCE(MAX(
    CAST(
      SUBSTRING(os_number FROM POSITION('-' IN os_number) + 10)
      AS INTEGER
    )
  ), 0) + 1
  INTO next_number
  FROM public.service_orders
  WHERE os_number LIKE date_prefix || '%';

  -- Gerar número com padding de 4 dígitos
  NEW.os_number := date_prefix || '-' || LPAD(next_number::TEXT, 4, '0');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_os_number
  BEFORE INSERT ON public.service_orders
  FOR EACH ROW
  WHEN (NEW.os_number IS NULL)
  EXECUTE FUNCTION generate_os_number();

-- =====================================================
-- Tabela de Tarefas da OS (Checklist detalhado)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.service_order_tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  service_order_id uuid NOT NULL,

  -- Informações da tarefa
  title character varying NOT NULL,
  description text,
  category character varying NOT NULL CHECK (
    category IN (
      'setup',          -- Montagem
      'operation',      -- Operação/Execução
      'monitoring',     -- Monitoramento
      'teardown',       -- Desmontagem
      'logistics',      -- Logística
      'other'           -- Outros
    )
  ),

  -- Atribuição
  assigned_to_type character varying CHECK (
    assigned_to_type IN ('professional', 'supplier', 'hrx_team', 'all')
  ),
  assigned_to_id uuid,                    -- ID do profissional/fornecedor
  assigned_to_name character varying,     -- Nome para referência

  -- Status
  status character varying NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'in_progress', 'completed', 'skipped')
  ),

  -- Timing
  estimated_duration_minutes integer,
  scheduled_time time without time zone,
  started_at timestamp with time zone,
  completed_at timestamp with time zone,

  -- Prioridade
  priority character varying DEFAULT 'normal' CHECK (
    priority IN ('low', 'normal', 'high', 'critical')
  ),

  -- Ordem de execução
  sequence_order integer NOT NULL DEFAULT 0,

  -- Dependências
  depends_on_task_ids uuid[] DEFAULT ARRAY[]::uuid[],

  -- Notas
  notes text,
  completion_notes text,

  -- Timestamps
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),

  CONSTRAINT service_order_tasks_pkey PRIMARY KEY (id),
  CONSTRAINT service_order_tasks_service_order_id_fkey FOREIGN KEY (service_order_id)
    REFERENCES public.service_orders(id) ON DELETE CASCADE
);

-- Índices
CREATE INDEX idx_service_order_tasks_os_id ON public.service_order_tasks(service_order_id);
CREATE INDEX idx_service_order_tasks_status ON public.service_order_tasks(status);
CREATE INDEX idx_service_order_tasks_assigned_to ON public.service_order_tasks(assigned_to_id);

-- =====================================================
-- Tabela de Timeline da OS (Cronograma)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.service_order_timeline (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  service_order_id uuid NOT NULL,

  -- Informações do evento na timeline
  title character varying NOT NULL,
  description text,

  -- Tipo de evento
  event_type character varying NOT NULL CHECK (
    event_type IN (
      'arrival',          -- Chegada da equipe
      'setup_start',      -- Início da montagem
      'setup_complete',   -- Montagem concluída
      'event_start',      -- Início do evento
      'event_end',        -- Fim do evento
      'teardown_start',   -- Início da desmontagem
      'teardown_complete',-- Desmontagem concluída
      'departure',        -- Saída da equipe
      'delivery',         -- Entrega de equipamento
      'pickup',           -- Retirada de equipamento
      'checkpoint',       -- Ponto de verificação
      'other'
    )
  ),

  -- Timing
  scheduled_time time without time zone NOT NULL,
  estimated_duration_minutes integer,

  -- Quem está envolvido
  involved_roles character varying[] DEFAULT ARRAY[]::character varying[],

  -- Status
  status character varying DEFAULT 'scheduled' CHECK (
    status IN ('scheduled', 'in_progress', 'completed', 'delayed', 'cancelled')
  ),

  -- Tracking
  actual_time timestamp with time zone,
  delay_minutes integer,

  -- Ordem
  sequence_order integer NOT NULL,

  -- Notas
  notes text,

  -- Timestamps
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),

  CONSTRAINT service_order_timeline_pkey PRIMARY KEY (id),
  CONSTRAINT service_order_timeline_service_order_id_fkey FOREIGN KEY (service_order_id)
    REFERENCES public.service_orders(id) ON DELETE CASCADE
);

-- Índices
CREATE INDEX idx_service_order_timeline_os_id ON public.service_order_timeline(service_order_id);
CREATE INDEX idx_service_order_timeline_scheduled_time ON public.service_order_timeline(scheduled_time);

-- =====================================================
-- Tabela de Log de Ações da OS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.service_order_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  service_order_id uuid NOT NULL,

  -- Ação
  action_type character varying NOT NULL CHECK (
    action_type IN (
      'created',
      'status_changed',
      'task_completed',
      'email_sent',
      'updated',
      'cancelled',
      'comment_added'
    )
  ),

  -- Detalhes
  description text NOT NULL,
  old_value text,
  new_value text,

  -- Quem realizou
  performed_by character varying,
  performed_by_type character varying CHECK (
    performed_by_type IN ('admin', 'professional', 'supplier', 'system', 'ai')
  ),

  -- Metadata
  metadata jsonb DEFAULT '{}'::jsonb,

  -- Timestamp
  created_at timestamp with time zone DEFAULT now(),

  CONSTRAINT service_order_logs_pkey PRIMARY KEY (id),
  CONSTRAINT service_order_logs_service_order_id_fkey FOREIGN KEY (service_order_id)
    REFERENCES public.service_orders(id) ON DELETE CASCADE
);

-- Índices
CREATE INDEX idx_service_order_logs_os_id ON public.service_order_logs(service_order_id);
CREATE INDEX idx_service_order_logs_created_at ON public.service_order_logs(created_at);

-- =====================================================
-- Comentários nas tabelas
-- =====================================================
COMMENT ON TABLE public.service_orders IS 'Ordens de Serviço geradas automaticamente por IA após assinatura de contrato';
COMMENT ON TABLE public.service_order_tasks IS 'Tarefas detalhadas de cada OS (checklist)';
COMMENT ON TABLE public.service_order_timeline IS 'Timeline/cronograma da OS';
COMMENT ON TABLE public.service_order_logs IS 'Log de ações e mudanças na OS';

COMMENT ON COLUMN public.service_orders.ai_briefing IS 'Briefing completo gerado pela GPT-4';
COMMENT ON COLUMN public.service_orders.ai_recommendations IS 'Recomendações inteligentes da IA';
COMMENT ON COLUMN public.service_orders.traffic_analysis IS 'Análise de trânsito via Mapbox';
COMMENT ON COLUMN public.service_orders.route_details IS 'Detalhes da rota calculados pelo Mapbox';
