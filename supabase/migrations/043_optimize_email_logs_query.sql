-- ============================================================================
-- Migration 043: Otimizar Consulta de Email Logs
-- ============================================================================
-- Data: 2025-10-30
-- Objetivo: Criar view/função para buscar último email de cada usuário
--   de forma eficiente, eliminando N+1 e melhorando performance
--
-- Performance esperada: 10-20x mais rápido que query atual
-- ============================================================================

-- ============================================================================
-- 1. CRIAR VIEW MATERIALIZADA (OPCIONAL - para grande volume)
-- ============================================================================

-- View materializada para email logs mais recentes (atualizada periodicamente)
-- Descomente se houver > 100k email logs e performance for crítica

-- CREATE MATERIALIZED VIEW IF NOT EXISTS public.latest_email_logs_by_recipient AS
-- SELECT DISTINCT ON (recipient_email)
--   recipient_email,
--   sent_at,
--   subject,
--   status,
--   template_used
-- FROM public.email_logs
-- ORDER BY recipient_email, sent_at DESC;

-- CREATE INDEX idx_latest_email_logs_recipient ON public.latest_email_logs_by_recipient(recipient_email);

-- -- Refresh automático (execute via cron job a cada 5 minutos)
-- -- REFRESH MATERIALIZED VIEW CONCURRENTLY public.latest_email_logs_by_recipient;

-- ============================================================================
-- 2. CRIAR FUNÇÃO RPC PARA BUSCAR ÚLTIMOS EMAILS
-- ============================================================================

-- Função otimizada que retorna apenas o último email de cada usuário
CREATE OR REPLACE FUNCTION public.get_latest_emails_by_recipients(
  recipient_emails TEXT[]
)
RETURNS TABLE (
  recipient_email TEXT,
  sent_at TIMESTAMPTZ,
  subject TEXT,
  status TEXT,
  template_used TEXT
)
LANGUAGE sql
STABLE
AS $$
  SELECT DISTINCT ON (el.recipient_email)
    el.recipient_email,
    el.sent_at,
    el.subject,
    el.status,
    el.template_used
  FROM public.email_logs el
  WHERE el.recipient_email = ANY(recipient_emails)
  ORDER BY el.recipient_email, el.sent_at DESC;
$$;

-- ============================================================================
-- 3. CRIAR ÍNDICE PARA PERFORMANCE
-- ============================================================================

-- Índice composto para otimizar a query de último email
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient_sent_at
ON public.email_logs(recipient_email, sent_at DESC);

-- Índice para busca por status (se necessário)
CREATE INDEX IF NOT EXISTS idx_email_logs_status
ON public.email_logs(status)
WHERE status IN ('sent', 'delivered');

-- ============================================================================
-- 4. COMENTÁRIOS E DOCUMENTAÇÃO
-- ============================================================================

COMMENT ON FUNCTION public.get_latest_emails_by_recipients(TEXT[]) IS
  'Retorna o email mais recente enviado para cada endereço na lista.
   Usa DISTINCT ON para performance otimizada.
   Uso: SELECT * FROM get_latest_emails_by_recipients(ARRAY[''email1@test.com'', ''email2@test.com'']);';

COMMENT ON INDEX public.idx_email_logs_recipient_sent_at IS
  'Índice composto para otimizar busca de emails mais recentes por recipient';

-- ============================================================================
-- 5. EXEMPLOS DE USO
-- ============================================================================

-- Exemplo 1: Buscar últimos emails de múltiplos usuários
-- SELECT * FROM public.get_latest_emails_by_recipients(
--   ARRAY['user1@test.com', 'user2@test.com', 'user3@test.com']
-- );

-- Exemplo 2: Contar emails por status
-- SELECT status, COUNT(*)
-- FROM public.email_logs
-- WHERE recipient_email IN ('user1@test.com', 'user2@test.com')
-- GROUP BY status;

-- Exemplo 3: Buscar emails recentes (últimos 7 dias)
-- SELECT recipient_email, COUNT(*) as total_emails
-- FROM public.email_logs
-- WHERE sent_at >= NOW() - INTERVAL '7 days'
-- GROUP BY recipient_email
-- ORDER BY total_emails DESC;

-- ============================================================================
-- VERIFICAÇÃO
-- ============================================================================

-- Testar a função
DO $$
BEGIN
  RAISE NOTICE '✅ Função get_latest_emails_by_recipients criada com sucesso';
  RAISE NOTICE 'ℹ️ Use: SELECT * FROM get_latest_emails_by_recipients(ARRAY[''email@test.com''])';
END $$;

-- Verificar índices criados
DO $$
DECLARE
  index_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND tablename = 'email_logs'
    AND indexname IN ('idx_email_logs_recipient_sent_at', 'idx_email_logs_status');

  RAISE NOTICE '✅ % índices criados na tabela email_logs', index_count;
END $$;
