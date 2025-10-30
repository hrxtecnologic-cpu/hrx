-- ============================================================================
-- Migration 046: Habilitar RLS nas Tabelas Restantes
-- ============================================================================
-- Data: 2025-10-30
-- Objetivo: Habilitar RLS em TODAS as tabelas públicas restantes
--   detectadas pelo Supabase Linter
--
-- Tabelas identificadas:
--   - event_types
--   - delivery_trackings
--   - delivery_location_history
--   - delivery_status_updates
--   - categories
--   - category_subcategories
--   - professional_history
--   - professionals
--   - equipment_suppliers
--   - event_projects
--   - project_team
--   - project_equipment
--   - supplier_quotations
--   - contracts
--   - service_orders
--   - notifications
--   - notification_preferences
--   - e outras...
-- ============================================================================

-- ============================================================================
-- ESTRATÉGIA:
-- Vamos habilitar RLS em TODAS as tabelas públicas e criar policies básicas:
-- - Admins podem tudo
-- - Usuários podem ver seus próprios dados
-- ============================================================================

-- ============================================================================
-- 1. TABELA: event_types
-- ============================================================================

ALTER TABLE public.event_types ENABLE ROW LEVEL SECURITY;

-- Policy: Qualquer um pode ver tipos de evento (dados públicos)
CREATE POLICY "event_types_select_public" ON public.event_types
  FOR SELECT
  USING (true);

-- Policy: Apenas admins podem criar/modificar
CREATE POLICY "event_types_admin_all" ON public.event_types
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.clerk_id = auth.uid()::text
      AND (u.user_type = 'admin' OR u.email IN (
        SELECT unnest(string_to_array(current_setting('app.admin_emails', true), ','))
      ))
    )
  );

-- ============================================================================
-- 2. TABELA: categories
-- ============================================================================

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Policy: Qualquer um pode ver categorias (dados públicos)
CREATE POLICY "categories_select_public" ON public.categories
  FOR SELECT
  USING (true);

-- Policy: Apenas admins podem criar/modificar
CREATE POLICY "categories_admin_all" ON public.categories
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.clerk_id = auth.uid()::text
      AND (u.user_type = 'admin' OR u.email IN (
        SELECT unnest(string_to_array(current_setting('app.admin_emails', true), ','))
      ))
    )
  );

-- ============================================================================
-- 3. TABELA: category_subcategories
-- ============================================================================

ALTER TABLE public.category_subcategories ENABLE ROW LEVEL SECURITY;

-- Policy: Qualquer um pode ver subcategorias (dados públicos)
CREATE POLICY "subcategories_select_public" ON public.category_subcategories
  FOR SELECT
  USING (true);

-- Policy: Apenas admins podem criar/modificar
CREATE POLICY "subcategories_admin_all" ON public.category_subcategories
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.clerk_id = auth.uid()::text
      AND (u.user_type = 'admin' OR u.email IN (
        SELECT unnest(string_to_array(current_setting('app.admin_emails', true), ','))
      ))
    )
  );

-- ============================================================================
-- 4. TABELAS DE DELIVERY TRACKING
-- ============================================================================

ALTER TABLE public.delivery_trackings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_location_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_status_updates ENABLE ROW LEVEL SECURITY;

-- Policy: Admins podem ver tudo
CREATE POLICY "delivery_trackings_admin" ON public.delivery_trackings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.clerk_id = auth.uid()::text
      AND (u.user_type = 'admin' OR u.email IN (
        SELECT unnest(string_to_array(current_setting('app.admin_emails', true), ','))
      ))
    )
  );

-- Policy: Fornecedor pode ver suas entregas
CREATE POLICY "delivery_trackings_supplier" ON public.delivery_trackings
  FOR SELECT
  USING (
    supplier_user_id IN (
      SELECT id FROM public.users WHERE clerk_id = auth.uid()::text
    )
  );

-- Policy: Fornecedor pode atualizar suas entregas
CREATE POLICY "delivery_trackings_supplier_update" ON public.delivery_trackings
  FOR UPDATE
  USING (
    supplier_user_id IN (
      SELECT id FROM public.users WHERE clerk_id = auth.uid()::text
    )
  );

-- Policies para delivery_location_history
CREATE POLICY "delivery_location_admin" ON public.delivery_location_history
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.clerk_id = auth.uid()::text
      AND (u.user_type = 'admin' OR u.email IN (
        SELECT unnest(string_to_array(current_setting('app.admin_emails', true), ','))
      ))
    )
  );

-- Policies para delivery_status_updates
CREATE POLICY "delivery_status_admin" ON public.delivery_status_updates
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.clerk_id = auth.uid()::text
      AND (u.user_type = 'admin' OR u.email IN (
        SELECT unnest(string_to_array(current_setting('app.admin_emails', true), ','))
      ))
    )
  );

-- ============================================================================
-- 5. TABELA: professionals (se ainda não tiver RLS)
-- ============================================================================

DO $$
BEGIN
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'professionals' AND relnamespace = 'public'::regnamespace) THEN
    ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;

    -- Policy: Profissional pode ver seu próprio perfil
    CREATE POLICY "professionals_select_own" ON public.professionals
      FOR SELECT
      USING (clerk_id = auth.uid()::text);

    -- Policy: Admins podem ver todos
    CREATE POLICY "professionals_select_admin" ON public.professionals
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.users u
          WHERE u.clerk_id = auth.uid()::text
          AND (u.user_type = 'admin' OR u.email IN (
            SELECT unnest(string_to_array(current_setting('app.admin_emails', true), ','))
          ))
        )
      );

    -- Policy: Profissional pode atualizar seu perfil
    CREATE POLICY "professionals_update_own" ON public.professionals
      FOR UPDATE
      USING (clerk_id = auth.uid()::text);

    -- Policy: Admins podem atualizar qualquer profissional
    CREATE POLICY "professionals_update_admin" ON public.professionals
      FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM public.users u
          WHERE u.clerk_id = auth.uid()::text
          AND (u.user_type = 'admin' OR u.email IN (
            SELECT unnest(string_to_array(current_setting('app.admin_emails', true), ','))
          ))
        )
      );
  END IF;
END $$;

-- ============================================================================
-- 6. TABELA: equipment_suppliers
-- ============================================================================

DO $$
BEGIN
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'equipment_suppliers' AND relnamespace = 'public'::regnamespace) THEN
    ALTER TABLE public.equipment_suppliers ENABLE ROW LEVEL SECURITY;

    -- Policy: Fornecedor pode ver seu próprio perfil
    CREATE POLICY "suppliers_select_own" ON public.equipment_suppliers
      FOR SELECT
      USING (clerk_id = auth.uid()::text);

    -- Policy: Admins podem ver todos
    CREATE POLICY "suppliers_select_admin" ON public.equipment_suppliers
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.users u
          WHERE u.clerk_id = auth.uid()::text
          AND (u.user_type = 'admin' OR u.email IN (
            SELECT unnest(string_to_array(current_setting('app.admin_emails', true), ','))
          ))
        )
      );

    -- Policy: Fornecedor pode atualizar seu perfil
    CREATE POLICY "suppliers_update_own" ON public.equipment_suppliers
      FOR UPDATE
      USING (clerk_id = auth.uid()::text);
  END IF;
END $$;

-- ============================================================================
-- 7. TABELA: event_projects
-- ============================================================================

DO $$
BEGIN
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'event_projects' AND relnamespace = 'public'::regnamespace) THEN
    ALTER TABLE public.event_projects ENABLE ROW LEVEL SECURITY;

    -- Policy: Admins podem ver todos os projetos
    CREATE POLICY "event_projects_admin" ON public.event_projects
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.users u
          WHERE u.clerk_id = auth.uid()::text
          AND (u.user_type = 'admin' OR u.email IN (
            SELECT unnest(string_to_array(current_setting('app.admin_emails', true), ','))
          ))
        )
      );
  END IF;
END $$;

-- ============================================================================
-- 8. TABELAS RESTANTES (Com policy genérica de admin)
-- ============================================================================

-- Lista de tabelas que precisam apenas policy de admin
DO $$
DECLARE
  table_name TEXT;
  tables_to_secure TEXT[] := ARRAY[
    'project_team',
    'project_equipment',
    'supplier_quotations',
    'contracts',
    'contract_audit_log',
    'service_orders',
    'service_order_tasks',
    'service_order_timeline',
    'service_order_logs',
    'notifications',
    'notification_preferences',
    'professional_history',
    'professional_reviews',
    'supplier_reviews',
    'document_validations',
    'project_emails',
    'rate_limits'
  ];
BEGIN
  FOREACH table_name IN ARRAY tables_to_secure
  LOOP
    -- Verificar se RLS já está habilitado
    IF NOT (
      SELECT relrowsecurity
      FROM pg_class
      WHERE relname = table_name
      AND relnamespace = 'public'::regnamespace
    ) THEN
      -- Habilitar RLS
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);

      -- Criar policy genérica de admin
      EXECUTE format('
        CREATE POLICY "%s_admin_all" ON public.%I
        FOR ALL
        USING (
          EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.clerk_id = auth.uid()::text
            AND (u.user_type = ''admin'' OR u.email IN (
              SELECT unnest(string_to_array(current_setting(''app.admin_emails'', true), '',''))
            ))
          )
        )
      ', table_name, table_name);

      RAISE NOTICE 'RLS habilitado em: %', table_name;
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- VERIFICAÇÃO FINAL
-- ============================================================================

-- Contar tabelas com RLS habilitado
DO $$
DECLARE
  total_tables INTEGER;
  tables_with_rls INTEGER;
  tables_without_rls INTEGER;
BEGIN
  -- Total de tabelas públicas
  SELECT COUNT(*) INTO total_tables
  FROM pg_tables
  WHERE schemaname = 'public';

  -- Tabelas com RLS
  SELECT COUNT(*) INTO tables_with_rls
  FROM pg_tables t
  JOIN pg_class c ON c.relname = t.tablename
  WHERE t.schemaname = 'public'
    AND c.relrowsecurity = true;

  -- Tabelas sem RLS
  tables_without_rls := total_tables - tables_with_rls;

  RAISE NOTICE '📊 Total de tabelas públicas: %', total_tables;
  RAISE NOTICE '✅ Tabelas com RLS: %', tables_with_rls;

  IF tables_without_rls > 0 THEN
    RAISE WARNING '⚠️ Tabelas SEM RLS: %', tables_without_rls;

    -- Listar tabelas sem RLS
    RAISE NOTICE 'Listando tabelas sem RLS:';
    FOR table_name IN
      SELECT t.tablename
      FROM pg_tables t
      LEFT JOIN pg_class c ON c.relname = t.tablename AND c.relnamespace = 'public'::regnamespace
      WHERE t.schemaname = 'public'
        AND (c.relrowsecurity IS NULL OR c.relrowsecurity = false)
    LOOP
      RAISE NOTICE '  - %', table_name;
    END LOOP;
  ELSE
    RAISE NOTICE '🎉 TODAS as tabelas públicas têm RLS habilitado!';
  END IF;
END $$;
