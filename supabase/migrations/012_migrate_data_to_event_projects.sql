-- =====================================================
-- Migration 012: Migrar Dados para Event Projects
-- =====================================================
-- Descrição: Migra dados existentes de contractor_requests para event_projects
--            EXECUTAR SOMENTE APÓS 011
-- Data: 2025-10-22
-- Autor: HRX Dev Team
-- ATENÇÃO: FAZER BACKUP DO BANCO ANTES DE EXECUTAR!
-- =====================================================

-- =====================================================
-- PARTE 1: MIGRAR CONTRACTOR_REQUESTS → EVENT_PROJECTS
-- =====================================================

INSERT INTO event_projects (
    id, -- Manter mesmo ID para preservar FKs
    project_number,
    client_name,
    client_email,
    client_phone,
    client_company,
    client_cnpj,
    event_name,
    event_type,
    event_description,
    event_date,
    start_time,
    end_time,
    expected_attendance,
    venue_name,
    venue_address,
    venue_city,
    venue_state,
    venue_zip,
    is_urgent,
    profit_margin,
    budget_range,
    status,
    additional_notes,
    created_at,
    updated_at,
    migrated_from_contractor_request_id
)
SELECT
    cr.id,
    'PRJ-' || TO_CHAR(cr.created_at, 'YYYYMMDD') || '-' || LPAD(ROW_NUMBER() OVER (ORDER BY cr.created_at)::TEXT, 4, '0'),
    cr.company_name,              -- client_name
    cr.email,                     -- client_email
    cr.phone,                     -- client_phone
    cr.company_name,              -- client_company
    cr.cnpj,                      -- client_cnpj
    cr.event_name,
    cr.event_type,
    cr.event_description,
    cr.start_date,                -- event_date
    cr.start_time,
    cr.end_time,
    cr.expected_attendance,
    cr.venue_name,
    cr.venue_address,
    cr.venue_city,
    cr.venue_state,
    cr.venue_zip,
    CASE
        WHEN cr.urgency = 'urgent' OR cr.urgency = 'very_urgent' THEN TRUE
        ELSE FALSE
    END AS is_urgent,
    CASE
        WHEN cr.urgency = 'urgent' OR cr.urgency = 'very_urgent' THEN 80.00
        ELSE 35.00
    END AS profit_margin,
    cr.budget_range,
    CASE cr.status
        WHEN 'pending' THEN 'new'
        WHEN 'approved' THEN 'analyzing'
        WHEN 'in_progress' THEN 'quoting'
        WHEN 'completed' THEN 'completed'
        WHEN 'cancelled' THEN 'cancelled'
        ELSE 'new'
    END AS status,
    cr.additional_notes,
    cr.created_at,
    cr.updated_at,
    cr.id -- Link de volta para contractor_request original
FROM contractor_requests cr
WHERE NOT EXISTS (
    SELECT 1 FROM event_projects ep WHERE ep.id = cr.id
);

-- Log de migração
DO $$
DECLARE
    migrated_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO migrated_count FROM event_projects WHERE migrated_from_contractor_request_id IS NOT NULL;
    RAISE NOTICE 'Migrados % contractor_requests para event_projects', migrated_count;
END $$;

-- =====================================================
-- PARTE 2: MIGRAR PROFESSIONALS_NEEDED → PROJECT_TEAM
-- =====================================================

-- Migrar profissionais solicitados de contractor_requests
INSERT INTO project_team (
    project_id,
    role,
    category,
    quantity,
    duration_days,
    status,
    notes,
    created_at
)
SELECT
    ep.id AS project_id,
    COALESCE(
        (prof_needed->>'role')::VARCHAR,
        (prof_needed->>'category')::VARCHAR,
        'Profissional'
    ) AS role,
    COALESCE(
        (prof_needed->>'category')::VARCHAR,
        'Geral'
    ) AS category,
    COALESCE((prof_needed->>'quantity')::INTEGER, 1) AS quantity,
    COALESCE(
        (ep.event_date - CURRENT_DATE) + 1,
        1
    ) AS duration_days,
    'planned' AS status,
    prof_needed->>'notes' AS notes,
    ep.created_at
FROM event_projects ep,
     jsonb_array_elements(
         COALESCE(
             (SELECT professionals_needed FROM contractor_requests WHERE id = ep.migrated_from_contractor_request_id),
             '[]'::jsonb
         )
     ) AS prof_needed
WHERE ep.migrated_from_contractor_request_id IS NOT NULL
  AND prof_needed IS NOT NULL;

-- Log de migração
DO $$
DECLARE
    migrated_team_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO migrated_team_count FROM project_team;
    RAISE NOTICE 'Migrados % membros de equipe para project_team', migrated_team_count;
END $$;

-- =====================================================
-- PARTE 3: MIGRAR EVENT_ALLOCATIONS → PROJECT_TEAM (professionalscriados)
-- =====================================================

-- Migrar alocações existentes de profissionais
INSERT INTO project_team (
    project_id,
    professional_id,
    role,
    category,
    quantity,
    duration_days,
    status,
    created_at,
    confirmed_at
)
SELECT
    ea.request_id AS project_id,
    (alloc->>'professional_id')::UUID AS professional_id,
    COALESCE(
        (alloc->>'role')::VARCHAR,
        (alloc->>'category')::VARCHAR,
        'Profissional Alocado'
    ) AS role,
    COALESCE(
        (alloc->>'category')::VARCHAR,
        'Geral'
    ) AS category,
    1 AS quantity,
    COALESCE((alloc->>'duration_days')::INTEGER, 1) AS duration_days,
    CASE
        WHEN (alloc->>'status')::VARCHAR = 'confirmed' THEN 'confirmed'
        WHEN (alloc->>'status')::VARCHAR = 'allocated' THEN 'allocated'
        ELSE 'planned'
    END AS status,
    ea.created_at,
    CASE
        WHEN (alloc->>'status')::VARCHAR IN ('confirmed', 'allocated') THEN ea.created_at
        ELSE NULL
    END AS confirmed_at
FROM event_allocations ea,
     jsonb_array_elements(ea.allocations) AS alloc
WHERE EXISTS (
    SELECT 1 FROM event_projects ep WHERE ep.id = ea.request_id
);

-- Log de migração
DO $$
DECLARE
    allocated_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO allocated_count
    FROM project_team
    WHERE professional_id IS NOT NULL;
    RAISE NOTICE 'Migrados % profissionais alocados para project_team', allocated_count;
END $$;

-- =====================================================
-- PARTE 4: MIGRAR EQUIPMENT_LIST → PROJECT_EQUIPMENT
-- =====================================================

-- Migrar equipamentos de contractor_requests.equipment_list
INSERT INTO project_equipment (
    project_id,
    equipment_type,
    category,
    name,
    description,
    quantity,
    duration_days,
    status,
    notes,
    created_at
)
SELECT
    ep.id AS project_id,
    COALESCE(equip::TEXT, 'Equipamento') AS equipment_type,
    'Equipamento' AS category, -- Categoria genérica
    COALESCE(equip::TEXT, 'Item não especificado') AS name,
    cr.equipment_notes AS description,
    1 AS quantity,
    GREATEST(
        COALESCE(
            (ep.event_date - CURRENT_DATE) + 1,
            1
        ),
        1
    ) AS duration_days,
    'requested' AS status,
    cr.equipment_other AS notes,
    ep.created_at
FROM event_projects ep
JOIN contractor_requests cr ON cr.id = ep.migrated_from_contractor_request_id
CROSS JOIN LATERAL unnest(
    COALESCE(cr.equipment_list, ARRAY[]::VARCHAR[])
) AS equip
WHERE ep.migrated_from_contractor_request_id IS NOT NULL
  AND cr.equipment_list IS NOT NULL
  AND array_length(cr.equipment_list, 1) > 0;

-- Log de migração
DO $$
DECLARE
    equipment_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO equipment_count FROM project_equipment;
    RAISE NOTICE 'Migrados % equipamentos para project_equipment', equipment_count;
END $$;

-- =====================================================
-- PARTE 5: MIGRAR QUOTE_REQUESTS → EVENT_PROJECTS
-- (Se houver quote_requests que não têm contractor_request linkado)
-- =====================================================

INSERT INTO event_projects (
    id,
    project_number,
    client_name,
    client_email,
    client_phone,
    event_name,
    event_date,
    event_type,
    event_description,
    is_urgent,
    profit_margin,
    status,
    total_cost,
    total_client_price,
    total_profit,
    created_by,
    created_at,
    updated_at,
    quoted_at,
    migrated_from_quote_request_id,
    venue_address,
    venue_city,
    venue_state
)
SELECT
    qr.id,
    'PRJ-QR-' || TO_CHAR(qr.created_at, 'YYYYMMDD') || '-' || SUBSTRING(qr.id::TEXT FROM 1 FOR 8),
    COALESCE(qr.client_name, 'Cliente não especificado'),
    qr.client_email,
    qr.client_phone,
    COALESCE(qr.event_type, 'Evento não especificado'),
    qr.event_date,
    COALESCE(qr.event_type, 'Outro'),
    qr.description,
    COALESCE(qr.is_urgent, FALSE),
    COALESCE(qr.profit_margin, 35.00),
    CASE qr.status
        WHEN 'draft' THEN 'new'
        WHEN 'sent' THEN 'quoting'
        WHEN 'analyzing' THEN 'quoted'
        WHEN 'finalized' THEN 'completed'
        WHEN 'cancelled' THEN 'cancelled'
        ELSE 'new'
    END AS status,
    COALESCE(qr.total_supplier_cost, 0),
    COALESCE(qr.total_client_price, 0),
    COALESCE(qr.total_profit, 0),
    qr.created_by,
    qr.created_at,
    qr.updated_at,
    qr.created_at AS quoted_at,
    qr.id,
    COALESCE(qr.event_location, 'A definir'),
    COALESCE(SPLIT_PART(qr.event_location, ',', -2), 'A definir'),
    COALESCE(SPLIT_PART(qr.event_location, ',', -1), 'A definir')
FROM quote_requests qr
WHERE NOT EXISTS (
    SELECT 1 FROM event_projects ep WHERE ep.id = qr.id
);

-- Log de migração
DO $$
DECLARE
    quote_migrated_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO quote_migrated_count FROM event_projects WHERE migrated_from_quote_request_id IS NOT NULL;
    RAISE NOTICE 'Migrados % quote_requests para event_projects', quote_migrated_count;
END $$;

-- =====================================================
-- PARTE 6: MIGRAR QUOTE_REQUEST_ITEMS → PROJECT_EQUIPMENT
-- =====================================================

INSERT INTO project_equipment (
    project_id,
    equipment_type,
    category,
    subcategory,
    name,
    description,
    quantity,
    duration_days,
    specifications,
    status,
    created_at,
    updated_at
)
SELECT
    ep.id AS project_id,
    COALESCE(qri.item_type, 'Equipamento'),
    COALESCE(qri.category, 'Geral'),
    qri.subcategory,
    COALESCE(qri.name, 'Item não especificado'),
    qri.description,
    COALESCE(qri.quantity, 1),
    COALESCE(qri.duration_days, 1),
    COALESCE(qri.specifications, '{}'::jsonb),
    CASE qri.status
        WHEN 'pending' THEN 'requested'
        WHEN 'quoted' THEN 'quoted'
        WHEN 'assigned' THEN 'selected'
        WHEN 'confirmed' THEN 'confirmed'
        ELSE 'requested'
    END AS status,
    qri.created_at,
    qri.updated_at
FROM quote_request_items qri
JOIN event_projects ep ON ep.migrated_from_quote_request_id = qri.quote_request_id
WHERE ep.migrated_from_quote_request_id IS NOT NULL;

-- Log de migração
DO $$
DECLARE
    quote_items_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO quote_items_count
    FROM project_equipment pe
    JOIN event_projects ep ON ep.id = pe.project_id
    WHERE ep.migrated_from_quote_request_id IS NOT NULL;
    RAISE NOTICE 'Migrados % quote_request_items para project_equipment', quote_items_count;
END $$;

-- =====================================================
-- PARTE 7: MIGRAR SUPPLIER_QUOTES → SUPPLIER_QUOTATIONS
-- =====================================================

INSERT INTO supplier_quotations (
    id,
    project_id,
    equipment_id,
    supplier_id,
    supplier_price,
    profit_margin_applied,
    hrx_price,
    profit_amount,
    availability_confirmed,
    status,
    supplier_notes,
    sent_at,
    received_at,
    accepted_at,
    rejected_at,
    created_at,
    updated_at
)
SELECT
    sq.id,
    ep.id AS project_id,
    pe.id AS equipment_id,
    sq.supplier_id,
    COALESCE(sq.supplier_price, 0),
    COALESCE(sq.profit_margin_applied, 35.00),
    COALESCE(sq.hrx_price, 0),
    COALESCE(sq.profit_amount, 0),
    COALESCE(sq.availability_confirmed, FALSE),
    COALESCE(sq.status, 'pending'),
    sq.notes AS supplier_notes,
    sq.sent_at,
    sq.received_at,
    sq.accepted_at,
    sq.rejected_at,
    sq.created_at,
    sq.updated_at
FROM supplier_quotes sq
JOIN event_projects ep ON ep.migrated_from_quote_request_id = sq.quote_request_id
JOIN project_equipment pe ON pe.project_id = ep.id
WHERE ep.migrated_from_quote_request_id IS NOT NULL
  AND sq.supplier_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM supplier_quotations WHERE id = sq.id
  );

-- Atualizar project_equipment com fornecedor selecionado
UPDATE project_equipment pe
SET
    selected_supplier_id = sq.supplier_id,
    selected_quote_id = sq.id
FROM supplier_quotations sq
WHERE sq.equipment_id = pe.id
  AND sq.status = 'accepted';

-- Log de migração
DO $$
DECLARE
    quotations_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO quotations_count FROM supplier_quotations;
    RAISE NOTICE 'Migrados % supplier_quotes para supplier_quotations', quotations_count;
END $$;

-- =====================================================
-- PARTE 8: MIGRAR QUOTE_EMAILS → PROJECT_EMAILS
-- =====================================================

INSERT INTO project_emails (
    id,
    project_id,
    quotation_id,
    recipient_email,
    recipient_name,
    recipient_type,
    email_type,
    status,
    resend_id,
    error_message,
    sent_at,
    delivered_at,
    created_at
)
SELECT
    qe.id,
    ep.id AS project_id,
    sq.id AS quotation_id,
    COALESCE(qe.recipient_email, 'nao-especificado@email.com'),
    qe.recipient_name,
    'supplier' AS recipient_type,
    COALESCE(qe.email_type, 'other'),
    COALESCE(qe.status, 'pending'),
    qe.resend_id,
    qe.error_message,
    qe.sent_at,
    qe.delivered_at,
    qe.created_at
FROM quote_emails qe
JOIN event_projects ep ON ep.migrated_from_quote_request_id = qe.quote_request_id
LEFT JOIN supplier_quotations sq ON sq.id = qe.supplier_quote_id
WHERE ep.migrated_from_quote_request_id IS NOT NULL
  AND qe.recipient_email IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM project_emails WHERE id = qe.id
  );

-- Log de migração
DO $$
DECLARE
    emails_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO emails_count FROM project_emails;
    RAISE NOTICE 'Migrados % quote_emails para project_emails', emails_count;
END $$;

-- =====================================================
-- PARTE 9: RECALCULAR TOTAIS DOS PROJETOS
-- =====================================================

-- Recalcular custos de equipe
UPDATE event_projects ep
SET total_team_cost = (
    SELECT COALESCE(SUM(total_cost), 0)
    FROM project_team
    WHERE project_id = ep.id
);

-- Recalcular custos de equipamentos
UPDATE event_projects ep
SET total_equipment_cost = (
    SELECT COALESCE(SUM(sq.supplier_price), 0)
    FROM project_equipment pe
    LEFT JOIN supplier_quotations sq ON sq.equipment_id = pe.id AND sq.status = 'accepted'
    WHERE pe.project_id = ep.id
);

-- Recalcular custo total
UPDATE event_projects
SET total_cost = total_team_cost + total_equipment_cost;

-- Recalcular preço para cliente (com margem)
UPDATE event_projects
SET total_client_price = total_cost * (1 + profit_margin / 100);

-- Recalcular lucro total
UPDATE event_projects
SET total_profit = total_client_price - total_cost;

-- Log final
DO $$
DECLARE
    total_projects INTEGER;
    total_team INTEGER;
    total_equipment INTEGER;
    total_quotations INTEGER;
    total_emails INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_projects FROM event_projects;
    SELECT COUNT(*) INTO total_team FROM project_team;
    SELECT COUNT(*) INTO total_equipment FROM project_equipment;
    SELECT COUNT(*) INTO total_quotations FROM supplier_quotations;
    SELECT COUNT(*) INTO total_emails FROM project_emails;

    RAISE NOTICE '====================================';
    RAISE NOTICE 'MIGRAÇÃO CONCLUÍDA COM SUCESSO!';
    RAISE NOTICE '====================================';
    RAISE NOTICE 'Projetos: %', total_projects;
    RAISE NOTICE 'Membros de Equipe: %', total_team;
    RAISE NOTICE 'Equipamentos: %', total_equipment;
    RAISE NOTICE 'Cotações: %', total_quotations;
    RAISE NOTICE 'Emails: %', total_emails;
    RAISE NOTICE '====================================';
END $$;

-- =====================================================
-- FIM DA MIGRATION 012
-- =====================================================
