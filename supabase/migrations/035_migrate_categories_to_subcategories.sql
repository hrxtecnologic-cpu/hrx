-- Migration 035: Migrar dados de categories para subcategories
-- Criado em: 2025-10-26
-- Descrição: Converte o array categories[] para o formato subcategories JSONB

-- =====================================================
-- 1. Mapeamento de categorias para subcategorias
-- =====================================================

-- Esta migration converte categories antigas para subcategories
-- Exemplo: categories = ["Segurança", "Motorista"]
-- Resultado: subcategories = {"Segurança": ["geral"], "Motorista": ["geral"]}

-- NOTA: Como não temos o histórico de subcategorias específicas escolhidas,
-- vamos criar uma subcategoria "geral" para cada categoria existente.
-- Os profissionais poderão atualizar depois para subcategorias mais específicas.

-- =====================================================
-- 2. Criar função de migração
-- =====================================================

CREATE OR REPLACE FUNCTION migrate_categories_to_subcategories()
RETURNS void AS $$
DECLARE
  prof RECORD;
  cat TEXT;
  new_subcategories JSONB;
  categories_array TEXT[];
BEGIN
  -- Iterar sobre todos os profissionais que têm categories mas subcategories vazio
  FOR prof IN
    SELECT id, categories
    FROM professionals
    WHERE
      categories IS NOT NULL
      AND jsonb_typeof(categories) = 'array'
      AND jsonb_array_length(categories) > 0
      AND (subcategories IS NULL OR subcategories = '{}'::jsonb)
  LOOP
    -- Inicializar objeto vazio
    new_subcategories := '{}'::jsonb;

    -- Converter JSONB array para TEXT array
    SELECT ARRAY(SELECT jsonb_array_elements_text(prof.categories)) INTO categories_array;

    -- Para cada categoria no array, criar entrada com subcategoria "geral"
    FOREACH cat IN ARRAY categories_array
    LOOP
      new_subcategories := jsonb_set(
        new_subcategories,
        ARRAY[cat],
        '["geral"]'::jsonb,
        true
      );
    END LOOP;

    -- Atualizar profissional com as novas subcategories
    UPDATE professionals
    SET
      subcategories = new_subcategories,
      updated_at = NOW()
    WHERE id = prof.id;

    RAISE NOTICE 'Migrado profissional % - Categories: % -> Subcategories: %',
      prof.id, prof.categories, new_subcategories;
  END LOOP;

  RAISE NOTICE 'Migração concluída!';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 3. Executar migração
-- =====================================================

-- Executar a função de migração
SELECT migrate_categories_to_subcategories();

-- =====================================================
-- 4. Verificação pós-migração
-- =====================================================

-- Criar view para verificar resultado da migração
CREATE OR REPLACE VIEW migration_verification AS
SELECT
  id,
  full_name,
  email,
  categories,
  subcategories,
  CASE
    WHEN categories IS NULL OR jsonb_array_length(categories) = 0 THEN 'SEM_CATEGORIES'
    WHEN subcategories IS NULL OR subcategories = '{}'::jsonb THEN 'NAO_MIGRADO'
    WHEN jsonb_typeof(subcategories) = 'object' THEN 'MIGRADO'
    ELSE 'ERRO'
  END as status_migracao
FROM professionals
ORDER BY status_migracao, created_at DESC;

-- Mostrar resumo da migração
SELECT
  status_migracao,
  COUNT(*) as total
FROM migration_verification
GROUP BY status_migracao
ORDER BY status_migracao;

-- =====================================================
-- 5. Comentários e documentação
-- =====================================================

COMMENT ON FUNCTION migrate_categories_to_subcategories IS
'Migra dados do campo categories (TEXT[]) para subcategories (JSONB).
Converte cada categoria em {"Categoria": ["geral"]} para manter compatibilidade.
Profissionais podem atualizar depois para subcategorias específicas.';

COMMENT ON VIEW migration_verification IS
'View para verificar o status da migração de categories para subcategories';

-- =====================================================
-- 6. Script de rollback (caso necessário)
-- =====================================================

-- Para reverter a migração (executar apenas se necessário):
-- UPDATE professionals SET subcategories = '{}'::jsonb WHERE subcategories IS NOT NULL;

-- =====================================================
-- FIM DA MIGRATION
-- =====================================================
