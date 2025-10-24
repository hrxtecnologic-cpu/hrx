-- =====================================================
-- LIMPAR DADOS DE TESTE DO PLAYWRIGHT
-- Execute este script no Supabase SQL Editor
-- =====================================================

-- Ver projetos de teste antes de deletar
SELECT
  id,
  project_number,
  client_name,
  client_email,
  event_name,
  created_at
FROM event_projects
WHERE
  client_name LIKE 'Teste Rate Limit%'
  OR client_name LIKE 'João Silva Teste%'
  OR event_name LIKE 'Evento Rate Test%'
  OR event_name LIKE 'Show de Rock E2E%'
  OR client_email LIKE '%ratelimit%@teste.com'
  OR client_email LIKE '%cliente%@teste.com'
ORDER BY created_at DESC;

-- Contar quantos serão deletados
SELECT COUNT(*) as total_testes
FROM event_projects
WHERE
  client_name LIKE 'Teste Rate Limit%'
  OR client_name LIKE 'João Silva Teste%'
  OR event_name LIKE 'Evento Rate Test%'
  OR event_name LIKE 'Show de Rock E2E%'
  OR client_email LIKE '%ratelimit%@teste.com'
  OR client_email LIKE '%cliente%@teste.com';

-- ⚠️ ATENÇÃO: Este comando vai DELETAR os dados de teste
-- Só execute se tiver certeza!

DELETE FROM event_projects
WHERE
  client_name LIKE 'Teste Rate Limit%'
  OR client_name LIKE 'João Silva Teste%'
  OR event_name LIKE 'Evento Rate Test%'
  OR event_name LIKE 'Show de Rock E2E%'
  OR client_email LIKE '%ratelimit%@teste.com'
  OR client_email LIKE '%cliente%@teste.com';

-- Verificar se foram deletados
SELECT COUNT(*) as projetos_restantes
FROM event_projects;
