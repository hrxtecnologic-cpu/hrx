-- =====================================================
-- Migration 033: Margem de Lucro Flexível
-- =====================================================
-- Data: 2025-10-26
-- Objetivo: Permitir margens de lucro personalizadas (0-100%)
--           ao invés de apenas 35% ou 80%
--
-- ANTES: profit_margin IN (35.00, 80.00) apenas
-- DEPOIS: profit_margin >= 0 AND profit_margin <= 100
--
-- Mantém: 35% como padrão, 80% para urgentes
-- Permite: Margens personalizadas para negociações
-- =====================================================

-- =====================================================
-- 1. REMOVER CONSTRAINT ANTIGA
-- =====================================================

ALTER TABLE event_projects
DROP CONSTRAINT IF EXISTS event_projects_profit_margin_check;

-- =====================================================
-- 2. REMOVER DEFAULT (deixar trigger definir)
-- =====================================================

ALTER TABLE event_projects
ALTER COLUMN profit_margin DROP DEFAULT;

-- =====================================================
-- 3. ADICIONAR CONSTRAINT FLEXÍVEL
-- =====================================================

ALTER TABLE event_projects
ADD CONSTRAINT event_projects_profit_margin_check
CHECK (profit_margin >= 0 AND profit_margin <= 100);

-- =====================================================
-- 4. ATUALIZAR FUNÇÃO DE CÁLCULO
-- =====================================================
-- A função agora apenas define valores PADRÃO
-- Mas permite que admin defina qualquer valor entre 0-100%

CREATE OR REPLACE FUNCTION calculate_project_profit_margin()
RETURNS TRIGGER AS $$
BEGIN
  -- Apenas define margem padrão se NÃO foi informada pelo usuário
  IF NEW.profit_margin IS NULL THEN
    IF NEW.is_urgent = TRUE THEN
      NEW.profit_margin := 80.00;  -- Padrão para urgente
    ELSE
      NEW.profit_margin := 35.00;  -- Padrão para normal
    END IF;
  END IF;

  -- Validar que está no range permitido
  IF NEW.profit_margin < 0 OR NEW.profit_margin > 100 THEN
    RAISE EXCEPTION 'Margem de lucro deve estar entre 0 e 100. Recebido: %', NEW.profit_margin;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. ATUALIZAR COMENTÁRIOS
-- =====================================================

COMMENT ON COLUMN event_projects.profit_margin IS
  'Margem de lucro em %. Padrão: 35% (normal) ou 80% (urgente). Permite valores personalizados de 0-100% para negociações.';

COMMENT ON COLUMN event_projects.is_urgent IS
  'Define margem padrão: TRUE = 80%, FALSE = 35%. Admin pode alterar manualmente a margem depois.';

-- =====================================================
-- 6. VERIFICAÇÃO
-- =====================================================

DO $$
BEGIN
  -- Verificar se constraint foi atualizado
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'event_projects_profit_margin_check'
      AND conrelid = 'event_projects'::regclass
  ) THEN
    RAISE EXCEPTION 'Constraint event_projects_profit_margin_check não foi criado';
  END IF;

  -- Verificar se função foi atualizada
  IF NOT EXISTS (
    SELECT 1
    FROM pg_proc
    WHERE proname = 'calculate_project_profit_margin'
  ) THEN
    RAISE EXCEPTION 'Função calculate_project_profit_margin não existe';
  END IF;

  RAISE NOTICE '✓ Migration 033 aplicada com sucesso!';
  RAISE NOTICE '✓ Margem de lucro agora aceita valores de 0%% a 100%%';
  RAISE NOTICE '✓ Padrões mantidos: 35%% (normal) e 80%% (urgente)';
END $$;

-- =====================================================
-- EXEMPLOS DE USO
-- =====================================================

-- Exemplo 1: Criar projeto normal (margem padrão 35%)
-- INSERT INTO event_projects (client_name, ..., is_urgent)
-- VALUES ('Cliente A', ..., FALSE);
-- Resultado: profit_margin = 35.00

-- Exemplo 2: Criar projeto urgente (margem padrão 80%)
-- INSERT INTO event_projects (client_name, ..., is_urgent)
-- VALUES ('Cliente B', ..., TRUE);
-- Resultado: profit_margin = 80.00

-- Exemplo 3: Criar projeto com margem PERSONALIZADA (negociação)
-- INSERT INTO event_projects (client_name, ..., profit_margin)
-- VALUES ('Cliente C', ..., 50.00);
-- Resultado: profit_margin = 50.00 (customizado)

-- Exemplo 4: Atualizar margem de projeto existente
-- UPDATE event_projects
-- SET profit_margin = 40.00
-- WHERE id = 'xxx';
-- Resultado: aceita qualquer valor 0-100%
