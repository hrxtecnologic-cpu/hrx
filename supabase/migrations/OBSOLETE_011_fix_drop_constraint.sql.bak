-- =====================================================
-- FIX: Remove constraint problemática da tabela project_team
-- =====================================================
-- Execute este script ANTES da migration 012
-- se você já executou a migration 011 com a constraint

-- Remove a constraint se ela existir
ALTER TABLE IF EXISTS project_team
DROP CONSTRAINT IF EXISTS team_member_identity;

-- Confirma remoção
DO $$
BEGIN
    RAISE NOTICE '✅ Constraint team_member_identity removida com sucesso!';
    RAISE NOTICE '📋 Agora você pode executar a migration 012 sem erros.';
END $$;
