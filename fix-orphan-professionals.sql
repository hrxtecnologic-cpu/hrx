-- ================================================================
-- SCRIPT DE CORREÇÃO: PROFISSIONAIS ÓRFÃOS (SEM user_id)
-- ================================================================
-- Data: 2025-10-25
-- Problema: 45+ profissionais cadastrados sem user_id
-- Causa: Webhook do Clerk falhando ou race condition
-- Solução: 3 passos de correção automática
-- ================================================================

-- ================================================================
-- PASSO 0: DIAGNÓSTICO INICIAL
-- ================================================================

-- Ver quantos profissionais órfãos existem
SELECT
  COUNT(*) as total_orfaos,
  COUNT(*) FILTER (WHERE clerk_id IS NOT NULL) as com_clerk_id,
  COUNT(*) FILTER (WHERE clerk_id IS NULL) as sem_clerk_id
FROM professionals
WHERE user_id IS NULL;

-- Ver detalhes dos órfãos
SELECT
  id,
  full_name,
  email,
  clerk_id,
  status,
  created_at
FROM professionals
WHERE user_id IS NULL
ORDER BY created_at DESC;

-- ================================================================
-- PASSO 1: LINKAR PROFISSIONAIS QUE TÊM clerk_id COM USERS EXISTENTES
-- ================================================================

-- Tentativa 1: Linkar via clerk_id
UPDATE professionals p
SET
  user_id = u.id,
  updated_at = NOW()
FROM users u
WHERE p.clerk_id = u.clerk_id
  AND p.user_id IS NULL
  AND p.clerk_id IS NOT NULL;

-- Verificar quantos foram linkados
SELECT
  COUNT(*) as ainda_orfaos,
  COUNT(*) FILTER (WHERE clerk_id IS NOT NULL) as com_clerk_id_mas_sem_user
FROM professionals
WHERE user_id IS NULL;

-- ================================================================
-- PASSO 2: CRIAR USERS FALTANTES PARA PROFISSIONAIS COM clerk_id
-- ================================================================

-- Inserir users para profissionais que têm clerk_id mas não têm user
INSERT INTO users (clerk_id, email, full_name, user_type, status, created_at, updated_at)
SELECT DISTINCT
  p.clerk_id,
  p.email,
  p.full_name,
  'professional',
  'active',
  p.created_at,
  NOW()
FROM professionals p
WHERE p.user_id IS NULL
  AND p.clerk_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM users u WHERE u.clerk_id = p.clerk_id
  )
ON CONFLICT (clerk_id) DO NOTHING;

-- Verificar quantos users foram criados
SELECT COUNT(*) as users_criados
FROM users
WHERE user_type = 'professional'
  AND created_at >= NOW() - INTERVAL '1 minute';

-- ================================================================
-- PASSO 3: LINKAR NOVAMENTE APÓS CRIAR USERS
-- ================================================================

-- Linkar profissionais com os users recém-criados
UPDATE professionals p
SET
  user_id = u.id,
  updated_at = NOW()
FROM users u
WHERE p.clerk_id = u.clerk_id
  AND p.user_id IS NULL
  AND p.clerk_id IS NOT NULL;

-- ================================================================
-- PASSO 4: TRATAR CASOS ESPECIAIS (SEM clerk_id)
-- ================================================================

-- Ver profissionais sem clerk_id (cadastrados antes do Clerk)
SELECT
  id,
  full_name,
  email,
  cpf,
  status,
  created_at
FROM professionals
WHERE user_id IS NULL
  AND clerk_id IS NULL
ORDER BY created_at DESC;

-- DECISÃO MANUAL NECESSÁRIA:
-- Opção A) Deletar se muito antigos (> 6 meses)
-- Opção B) Criar manualmente no Clerk depois linkar aqui
-- Opção C) Deixar como está (não poderão fazer login)

-- Exemplo para deletar profissionais muito antigos sem clerk_id:
-- DELETE FROM professionals
-- WHERE user_id IS NULL
--   AND clerk_id IS NULL
--   AND created_at < NOW() - INTERVAL '6 months';

-- ================================================================
-- PASSO 5: VERIFICAÇÃO FINAL
-- ================================================================

-- 1. Contagem final de órfãos
SELECT
  COUNT(*) as total_profissionais,
  COUNT(*) FILTER (WHERE user_id IS NOT NULL) as com_user_id,
  COUNT(*) FILTER (WHERE user_id IS NULL) as ainda_orfaos,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE user_id IS NOT NULL) / COUNT(*),
    2
  ) as percentual_corrigido
FROM professionals;

-- 2. Breakdown por status
SELECT
  CASE
    WHEN user_id IS NOT NULL AND clerk_id IS NOT NULL THEN '✅ OK: Com user_id e clerk_id'
    WHEN user_id IS NOT NULL AND clerk_id IS NULL THEN '⚠️ Com user_id mas sem clerk_id'
    WHEN user_id IS NULL AND clerk_id IS NOT NULL THEN '❌ Órfão com clerk_id'
    WHEN user_id IS NULL AND clerk_id IS NULL THEN '❌ Órfão sem clerk_id'
  END as status_categoria,
  COUNT(*) as quantidade
FROM professionals
GROUP BY status_categoria
ORDER BY quantidade DESC;

-- 3. Verificar se todos os users têm tipo correto
SELECT
  u.user_type,
  COUNT(DISTINCT p.id) as profissionais_linkados
FROM professionals p
JOIN users u ON p.user_id = u.id
GROUP BY u.user_type;

-- 4. Profissionais ainda órfãos (se houver)
SELECT
  id,
  full_name,
  email,
  clerk_id,
  status,
  created_at,
  CASE
    WHEN clerk_id IS NOT NULL THEN 'Tem clerk_id mas não achou user'
    ELSE 'Sem clerk_id (cadastro antigo)'
  END as motivo
FROM professionals
WHERE user_id IS NULL
ORDER BY created_at DESC;

-- ================================================================
-- RELATÓRIO FINAL
-- ================================================================

DO $$
DECLARE
  total_profissionais INTEGER;
  total_corrigidos INTEGER;
  total_orfaos INTEGER;
  percentual NUMERIC;
BEGIN
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE user_id IS NOT NULL),
    COUNT(*) FILTER (WHERE user_id IS NULL)
  INTO total_profissionais, total_corrigidos, total_orfaos
  FROM professionals;

  percentual := ROUND(100.0 * total_corrigidos / total_profissionais, 2);

  RAISE NOTICE '';
  RAISE NOTICE '================================================================';
  RAISE NOTICE '           RELATÓRIO DE CORREÇÃO DE PROFISSIONAIS ÓRFÃOS';
  RAISE NOTICE '================================================================';
  RAISE NOTICE 'Total de profissionais: %', total_profissionais;
  RAISE NOTICE 'Profissionais corrigidos: % (% %%)', total_corrigidos, percentual;
  RAISE NOTICE 'Profissionais ainda órfãos: %', total_orfaos;
  RAISE NOTICE '================================================================';

  IF total_orfaos > 0 THEN
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  ATENÇÃO: Ainda existem % profissionais órfãos', total_orfaos;
    RAISE NOTICE 'Execute a query do PASSO 4 para ver detalhes';
  ELSE
    RAISE NOTICE '';
    RAISE NOTICE '✅ SUCESSO: Todos os profissionais foram corrigidos!';
  END IF;

  RAISE NOTICE '';
END $$;

-- ================================================================
-- OBSERVAÇÕES IMPORTANTES:
-- ================================================================
--
-- 1. Este script é IDEMPOTENTE (pode rodar múltiplas vezes sem problemas)
-- 2. Usa ON CONFLICT para evitar duplicatas
-- 3. Não deleta nada automaticamente
-- 4. Casos sem clerk_id precisam decisão manual
-- 5. Após rodar, verifique o relatório final
--
-- PRÓXIMOS PASSOS:
-- 1. Investigar por que webhook do Clerk falhou
-- 2. Adicionar logs no webhook para debug futuro
-- 3. Considerar criar trigger para prevenir órfãos
--
-- ================================================================
