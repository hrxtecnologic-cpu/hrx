-- =====================================================
-- Migration 034: Adicionar Orçamento Fixo do Cliente
-- =====================================================
-- Data: 2025-10-26
-- Objetivo: Adicionar campo para orçamento fixo do cliente
--
-- Motivação:
--   - Cliente informa: "Tenho R$ 10.000 para gastar"
--   - Este valor deve ser FIXO (não muda quando adiciona equipe/equipamentos)
--   - Admin vê custo real vs orçamento cliente
--   - Calcula margem real (não apenas margem teórica)
--
-- Diferença entre campos:
--   - budget_range: Faixa textual (ex: "5000-10000")
--   - client_budget: Valor exato informado pelo cliente (ex: 10000.00)
--   - total_cost: Custo real HRX (equipe + equipamentos)
--   - total_client_price: Calculado automaticamente (pode ser diferente do orçamento)
-- =====================================================

-- =====================================================
-- 1. ADICIONAR COLUNA client_budget
-- =====================================================

ALTER TABLE event_projects
ADD COLUMN client_budget NUMERIC(10,2);

-- =====================================================
-- 2. ADICIONAR COMENTÁRIO
-- =====================================================

COMMENT ON COLUMN event_projects.client_budget IS
  'Orçamento fixo informado pelo cliente. Não é calculado automaticamente. Serve como referência para o admin comparar com total_cost e verificar viabilidade.';

COMMENT ON COLUMN event_projects.budget_range IS
  'Faixa de orçamento em texto (ex: "5000-10000"). Campo legado, mantido por compatibilidade.';

COMMENT ON COLUMN event_projects.total_client_price IS
  'Preço calculado automaticamente: total_cost × (1 + profit_margin/100). Pode ser diferente de client_budget.';

-- =====================================================
-- 3. CRIAR ÍNDICE (opcional, para queries)
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_event_projects_client_budget
ON event_projects(client_budget)
WHERE client_budget IS NOT NULL;

-- =====================================================
-- 4. VERIFICAÇÃO
-- =====================================================

DO $$
BEGIN
  -- Verificar se coluna foi criada
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'event_projects'
      AND column_name = 'client_budget'
  ) THEN
    RAISE EXCEPTION 'Coluna client_budget não foi criada';
  END IF;

  RAISE NOTICE '✓ Migration 034 aplicada com sucesso!';
  RAISE NOTICE '✓ Coluna client_budget adicionada à tabela event_projects';
  RAISE NOTICE '✓ Tipo: NUMERIC(10,2) - aceita valores até R$ 99.999.999,99';
  RAISE NOTICE '✓ Permite NULL - campo opcional';
END $$;

-- =====================================================
-- EXEMPLOS DE USO
-- =====================================================

-- Exemplo 1: Cliente informa orçamento exato
-- INSERT INTO event_projects (
--   client_name,
--   event_name,
--   client_budget  ← NOVO CAMPO
-- ) VALUES (
--   'João Silva',
--   'Casamento',
--   15000.00  ← Cliente tem R$ 15.000
-- );

-- Exemplo 2: Admin compara orçamento vs custo real
-- SELECT
--   project_number,
--   client_budget,           -- R$ 15.000 (o que cliente tem)
--   total_cost,              -- R$ 12.000 (o que vai custar)
--   client_budget - total_cost AS margem_disponivel,  -- R$ 3.000 sobrando
--   ROUND(((client_budget - total_cost) / total_cost * 100), 2) AS margem_real_percent  -- 25%
-- FROM event_projects
-- WHERE client_budget IS NOT NULL;

-- Exemplo 3: Alertas (para implementar no frontend)
-- SELECT
--   project_number,
--   CASE
--     WHEN total_cost > client_budget THEN '❌ Custo excede orçamento!'
--     WHEN (client_budget - total_cost) / total_cost < 0.20 THEN '⚠️ Margem baixa (< 20%)'
--     WHEN (client_budget - total_cost) / total_cost >= 0.35 THEN '✅ Margem saudável (>= 35%)'
--     ELSE '⚠️ Margem média (20-35%)'
--   END AS status_financeiro,
--   client_budget,
--   total_cost,
--   client_budget - total_cost AS lucro_real
-- FROM event_projects
-- WHERE client_budget IS NOT NULL
--   AND total_cost > 0;

-- =====================================================
-- NOTAS IMPORTANTES
-- =====================================================

-- 1. Campo é OPCIONAL (NULL permitido)
--    - Cliente pode não informar orçamento
--    - Admin pode adicionar depois
--
-- 2. Campo é INDEPENDENTE dos cálculos automáticos
--    - Não afeta total_client_price (calculado por trigger)
--    - É apenas referência para comparação
--
-- 3. Comparação útil:
--    client_budget    = "quanto cliente PODE pagar"
--    total_cost       = "quanto VAI CUSTAR"
--    total_client_price = "quanto sistema CALCULA" (com margem)
--
-- 4. Frontend deve mostrar:
--    ┌─────────────────────────────────────┐
--    │ 💰 CONTABILIDADE                    │
--    ├─────────────────────────────────────┤
--    │ Orçamento Cliente:  R$ 15.000,00   │
--    │ Custo Real:         R$ 12.000,00   │
--    │ ─────────────────────────────────  │
--    │ Lucro Real:         R$ 3.000,00    │
--    │ Margem Real:        25%            │
--    │                                     │
--    │ ✅ Dentro do orçamento             │
--    └─────────────────────────────────────┘
