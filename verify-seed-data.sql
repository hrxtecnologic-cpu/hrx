-- Script para verificar se os dados do seed foram inseridos corretamente
-- Execute este script no SQL Editor do Supabase APÓS executar seed-complete-data.sql

-- 1. Verificar Profissionais
SELECT
  'Profissionais' as tabela,
  COUNT(*) as total,
  COUNT(CASE WHEN status = 'approved' THEN 1 END) as aprovados,
  COUNT(CASE WHEN documents IS NOT NULL THEN 1 END) as com_documentos,
  COUNT(CASE WHEN portfolio_urls IS NOT NULL THEN 1 END) as com_portfolio,
  COUNT(CASE WHEN latitude IS NOT NULL AND longitude IS NOT NULL THEN 1 END) as com_coordenadas
FROM professionals;

-- 2. Verificar Fornecedores
SELECT
  'Fornecedores' as tabela,
  COUNT(*) as total,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as ativos,
  COUNT(CASE WHEN pricing IS NOT NULL THEN 1 END) as com_precos,
  COUNT(CASE WHEN latitude IS NOT NULL AND longitude IS NOT NULL THEN 1 END) as com_coordenadas
FROM equipment_suppliers;

-- 3. Verificar Projetos
SELECT
  'Projetos' as tabela,
  COUNT(*) as total,
  COUNT(CASE WHEN status = 'planning' THEN 1 END) as em_planejamento,
  COUNT(CASE WHEN latitude IS NOT NULL AND longitude IS NOT NULL THEN 1 END) as com_localizacao
FROM event_projects;

-- 4. Verificar Times dos Projetos
SELECT
  'Times de Projeto' as tabela,
  COUNT(*) as total_alocacoes,
  COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmados,
  COUNT(CASE WHEN status = 'invited' THEN 1 END) as convidados,
  COUNT(CASE WHEN status = 'planned' THEN 1 END) as planejados
FROM project_team;

-- 5. Verificar Equipamentos dos Projetos
SELECT
  'Equipamentos de Projeto' as tabela,
  COUNT(*) as total_equipamentos,
  COUNT(CASE WHEN supplier_id IS NOT NULL THEN 1 END) as com_fornecedor,
  SUM(quantity) as quantidade_total
FROM project_equipment;

-- 6. Listar Profissionais Criados
SELECT
  full_name as nome,
  city as cidade,
  state as estado,
  categories->0 as categoria_principal,
  has_experience as tem_experiencia,
  experience_years as anos_experiencia,
  status
FROM professionals
ORDER BY full_name;

-- 7. Listar Fornecedores Criados
SELECT
  company_name as empresa,
  city as cidade,
  state as estado,
  equipment_types as tipos_equipamento,
  status
FROM equipment_suppliers
ORDER BY company_name;

-- 8. Listar Projetos com Contagem de Equipe
SELECT
  ep.name as projeto,
  ep.event_type as tipo,
  ep.start_date as data_inicio,
  ep.end_date as data_fim,
  ep.city as cidade,
  COUNT(pt.id) as membros_equipe,
  ep.status
FROM event_projects ep
LEFT JOIN project_team pt ON ep.id = pt.event_project_id
GROUP BY ep.id, ep.name, ep.event_type, ep.start_date, ep.end_date, ep.city, ep.status
ORDER BY ep.start_date;

-- 9. Verificar Integridade dos Dados
SELECT
  'Verificação de Integridade' as tipo,
  CASE
    WHEN EXISTS (SELECT 1 FROM professionals WHERE user_id IS NULL)
    THEN 'ERRO: Profissionais sem user_id'
    ELSE 'OK: Todos profissionais têm user_id'
  END as resultado_profissionais,
  CASE
    WHEN EXISTS (SELECT 1 FROM event_projects WHERE client_id IS NULL)
    THEN 'ERRO: Projetos sem client_id'
    ELSE 'OK: Todos projetos têm client_id'
  END as resultado_projetos,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM project_team pt
      LEFT JOIN professionals p ON pt.professional_id = p.id
      WHERE p.id IS NULL
    )
    THEN 'ERRO: Alocações com profissional inexistente'
    ELSE 'OK: Todas alocações válidas'
  END as resultado_alocacoes;

-- 10. Detalhes de Um Profissional de Exemplo
SELECT
  full_name,
  email,
  phone,
  city || ', ' || state as localizacao,
  categories,
  subcategories,
  certifications,
  has_experience,
  experience_years,
  experience_description,
  jsonb_array_length(portfolio_urls) as qtd_fotos_portfolio,
  status,
  approved_at
FROM professionals
WHERE full_name = 'João Silva';
