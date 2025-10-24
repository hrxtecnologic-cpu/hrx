-- =====================================================
-- INVESTIGAÇÃO: Profissionais com possíveis erros no cadastro
-- =====================================================

-- 1. Profissionais que enviaram documentos mas ficaram com status pendente
-- (possível erro no webhook ou no processo de aprovação)
SELECT
    id,
    full_name,
    email,
    phone,
    cpf,
    status,
    created_at,
    updated_at,
    clerk_id,
    user_id,
    -- Verificar documentos JSONB
    documents,
    -- Contar documentos no JSONB
    CASE
        WHEN documents IS NOT NULL AND jsonb_typeof(documents) = 'object'
        THEN (SELECT COUNT(*) FROM jsonb_object_keys(documents))
        ELSE 0
    END as total_docs_jsonb,
    -- Verificar URLs de fotos antigas (booleanos)
    rg_photo_url IS NOT NULL as tem_rg,
    cpf_photo_url IS NOT NULL as tem_cpf,
    proof_of_residence_url IS NOT NULL as tem_comprovante,
    profile_photo_url IS NOT NULL as tem_foto_perfil
FROM professionals
WHERE status = 'pending'
  AND created_at >= '2025-01-23'::date  -- Últimos 2 dias
ORDER BY created_at DESC;

-- 2. Profissionais com documentos mas sem user_id (possível falha no webhook Clerk)
SELECT
    id,
    full_name,
    email,
    clerk_id,
    user_id,
    status,
    created_at,
    documents,
    rg_photo_url IS NOT NULL as tem_rg,
    cpf_photo_url IS NOT NULL as tem_cpf,
    proof_of_residence_url IS NOT NULL as tem_comprovante
FROM professionals
WHERE user_id IS NULL
  AND created_at >= '2025-01-20'::date
ORDER BY created_at DESC;

-- 3. Profissionais que cadastraram recentemente (últimas 24h)
SELECT
    id,
    full_name,
    email,
    phone,
    status,
    clerk_id,
    user_id IS NOT NULL as tem_user_id,
    documents IS NOT NULL as tem_documentos,
    created_at,
    updated_at
FROM professionals
WHERE created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- 4. Contar profissionais por status nos últimos 7 dias
SELECT
    status,
    COUNT(*) as total,
    COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as com_user_id,
    COUNT(CASE WHEN clerk_id IS NOT NULL THEN 1 END) as com_clerk_id,
    COUNT(CASE WHEN documents IS NOT NULL THEN 1 END) as com_documentos
FROM professionals
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY status
ORDER BY total DESC;

-- 5. Profissionais rejeitados recentemente
SELECT
    id,
    full_name,
    email,
    status,
    rejection_reason,
    created_at,
    updated_at
FROM professionals
WHERE status = 'rejected'
  AND updated_at >= NOW() - INTERVAL '7 days'
ORDER BY updated_at DESC;
