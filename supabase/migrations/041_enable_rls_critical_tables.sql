-- ============================================================================
-- Migration 041: Habilitar RLS nas Tabelas Críticas
-- ============================================================================
-- Data: 2025-10-30
-- Objetivo: Corrigir vulnerabilidade de segurança habilitando RLS nas tabelas:
--   - users
--   - contractors
--   - requests
--   - email_logs
--
-- IMPORTANTE: Esta migração é CRÍTICA para segurança em produção!
-- ============================================================================

-- ============================================================================
-- 1. TABELA: users
-- ============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários podem ver seu próprio registro
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT
  USING (auth.uid()::text = clerk_id);

-- Policy: Admins podem ver todos os usuários
CREATE POLICY "users_select_admin" ON public.users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.clerk_id = auth.uid()::text
      AND (
        u.email IN (
          SELECT unnest(string_to_array(current_setting('app.admin_emails', true), ','))
        )
        OR (u.user_type = 'admin')
      )
    )
  );

-- Policy: Sistema pode inserir novos usuários (webhook Clerk)
CREATE POLICY "users_insert_system" ON public.users
  FOR INSERT
  WITH CHECK (true);

-- Policy: Usuários podem atualizar seu próprio registro
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE
  USING (auth.uid()::text = clerk_id);

-- Policy: Admins podem atualizar qualquer usuário
CREATE POLICY "users_update_admin" ON public.users
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.clerk_id = auth.uid()::text
      AND (
        u.email IN (
          SELECT unnest(string_to_array(current_setting('app.admin_emails', true), ','))
        )
        OR (u.user_type = 'admin')
      )
    )
  );

-- ============================================================================
-- 2. TABELA: contractors
-- ============================================================================

ALTER TABLE public.contractors ENABLE ROW LEVEL SECURITY;

-- Policy: Contratantes podem ver seu próprio registro
CREATE POLICY "contractors_select_own" ON public.contractors
  FOR SELECT
  USING (clerk_id = auth.uid()::text);

-- Policy: Admins podem ver todos os contratantes
CREATE POLICY "contractors_select_admin" ON public.contractors
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.clerk_id = auth.uid()::text
      AND (
        u.email IN (
          SELECT unnest(string_to_array(current_setting('app.admin_emails', true), ','))
        )
        OR (u.user_type = 'admin')
      )
    )
  );

-- Policy: Contratantes podem criar seu próprio registro
CREATE POLICY "contractors_insert_own" ON public.contractors
  FOR INSERT
  WITH CHECK (clerk_id = auth.uid()::text);

-- Policy: Admins podem criar qualquer registro
CREATE POLICY "contractors_insert_admin" ON public.contractors
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.clerk_id = auth.uid()::text
      AND (
        u.email IN (
          SELECT unnest(string_to_array(current_setting('app.admin_emails', true), ','))
        )
        OR (u.user_type = 'admin')
      )
    )
  );

-- Policy: Contratantes podem atualizar seu próprio registro
CREATE POLICY "contractors_update_own" ON public.contractors
  FOR UPDATE
  USING (clerk_id = auth.uid()::text);

-- Policy: Admins podem atualizar qualquer contratante
CREATE POLICY "contractors_update_admin" ON public.contractors
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.clerk_id = auth.uid()::text
      AND (
        u.email IN (
          SELECT unnest(string_to_array(current_setting('app.admin_emails', true), ','))
        )
        OR (u.user_type = 'admin')
      )
    )
  );

-- ============================================================================
-- 3. TABELA: requests (ANTIGA - será removida em migração futura)
-- ============================================================================

ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;

-- Policy: Contratantes podem ver suas próprias solicitações
CREATE POLICY "requests_select_own" ON public.requests
  FOR SELECT
  USING (
    contractor_id IN (
      SELECT id FROM public.contractors
      WHERE clerk_id = auth.uid()::text
    )
  );

-- Policy: Admins podem ver todas as solicitações
CREATE POLICY "requests_select_admin" ON public.requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.clerk_id = auth.uid()::text
      AND (
        u.email IN (
          SELECT unnest(string_to_array(current_setting('app.admin_emails', true), ','))
        )
        OR (u.user_type = 'admin')
      )
    )
  );

-- Policy: Contratantes podem criar suas próprias solicitações
CREATE POLICY "requests_insert_own" ON public.requests
  FOR INSERT
  WITH CHECK (
    contractor_id IN (
      SELECT id FROM public.contractors
      WHERE clerk_id = auth.uid()::text
    )
  );

-- Policy: Contratantes podem atualizar suas próprias solicitações
CREATE POLICY "requests_update_own" ON public.requests
  FOR UPDATE
  USING (
    contractor_id IN (
      SELECT id FROM public.contractors
      WHERE clerk_id = auth.uid()::text
    )
  );

-- Policy: Admins podem atualizar qualquer solicitação
CREATE POLICY "requests_update_admin" ON public.requests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.clerk_id = auth.uid()::text
      AND (
        u.email IN (
          SELECT unnest(string_to_array(current_setting('app.admin_emails', true), ','))
        )
        OR (u.user_type = 'admin')
      )
    )
  );

-- ============================================================================
-- 4. TABELA: email_logs
-- ============================================================================

ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários podem ver emails enviados para seu endereço
CREATE POLICY "email_logs_select_own" ON public.email_logs
  FOR SELECT
  USING (
    recipient_email IN (
      SELECT email FROM public.users
      WHERE clerk_id = auth.uid()::text
    )
  );

-- Policy: Admins podem ver todos os email logs
CREATE POLICY "email_logs_select_admin" ON public.email_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.clerk_id = auth.uid()::text
      AND (
        u.email IN (
          SELECT unnest(string_to_array(current_setting('app.admin_emails', true), ','))
        )
        OR (u.user_type = 'admin')
      )
    )
  );

-- Policy: Sistema pode inserir email logs
CREATE POLICY "email_logs_insert_system" ON public.email_logs
  FOR INSERT
  WITH CHECK (true);

-- Policy: Sistema pode atualizar email logs (status de envio)
CREATE POLICY "email_logs_update_system" ON public.email_logs
  FOR UPDATE
  USING (true);

-- ============================================================================
-- 5. CONFIGURAR VARIÁVEL DE AMBIENTE PARA ADMIN_EMAILS
-- ============================================================================

-- NOTA: O app deve setar esta variável via Supabase Dashboard ou no código:
-- ALTER DATABASE postgres SET app.admin_emails = 'admin@hrx.com,outro@hrx.com';

-- ============================================================================
-- 6. ÍNDICES PARA PERFORMANCE DAS POLICIES
-- ============================================================================

-- Índice para busca rápida de usuários por clerk_id
CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON public.users(clerk_id);

-- Índice para busca rápida de contractors por clerk_id
CREATE INDEX IF NOT EXISTS idx_contractors_clerk_id ON public.contractors(clerk_id);

-- Índice para busca rápida de email logs por recipient_email
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON public.email_logs(recipient_email);

-- ============================================================================
-- 7. COMENTÁRIOS E DOCUMENTAÇÃO
-- ============================================================================

COMMENT ON POLICY "users_select_own" ON public.users IS
  'Permite que usuários vejam seu próprio registro';

COMMENT ON POLICY "users_select_admin" ON public.users IS
  'Permite que admins vejam todos os usuários';

COMMENT ON POLICY "contractors_select_own" ON public.contractors IS
  'Permite que contratantes vejam seu próprio registro';

COMMENT ON POLICY "contractors_select_admin" ON public.contractors IS
  'Permite que admins vejam todos os contratantes';

COMMENT ON POLICY "requests_select_own" ON public.requests IS
  'Permite que contratantes vejam suas próprias solicitações';

COMMENT ON POLICY "requests_select_admin" ON public.requests IS
  'Permite que admins vejam todas as solicitações';

COMMENT ON POLICY "email_logs_select_own" ON public.email_logs IS
  'Permite que usuários vejam emails enviados para eles';

COMMENT ON POLICY "email_logs_select_admin" ON public.email_logs IS
  'Permite que admins vejam todos os email logs';

-- ============================================================================
-- VERIFICAÇÃO
-- ============================================================================

-- Para testar se RLS está habilitado, execute:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('users', 'contractors', 'requests', 'email_logs');

-- Para listar todas as policies, execute:
-- SELECT schemaname, tablename, policyname FROM pg_policies WHERE tablename IN ('users', 'contractors', 'requests', 'email_logs');
