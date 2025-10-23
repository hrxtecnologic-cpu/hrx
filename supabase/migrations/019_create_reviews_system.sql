-- =====================================================
-- Migration: Sistema de Avaliações
-- Criado em: 2025-10-23
-- Descrição: Sistema de avaliações de profissionais e fornecedores após eventos
-- Status: BASE PREPARADA (aguardando implementação completa)
-- =====================================================

-- =====================================================
-- TABELA: professional_reviews
-- =====================================================
-- Avaliações de profissionais após eventos

CREATE TABLE IF NOT EXISTS professional_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Relacionamentos
    project_id UUID NOT NULL REFERENCES event_projects(id) ON DELETE CASCADE,
    team_member_id UUID NOT NULL REFERENCES project_team(id) ON DELETE CASCADE,
    professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,

    -- Avaliação
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,

    -- Critérios específicos (1-5)
    punctuality_rating INTEGER CHECK (punctuality_rating >= 1 AND punctuality_rating <= 5),
    professionalism_rating INTEGER CHECK (professionalism_rating >= 1 AND professionalism_rating <= 5),
    quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
    communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),

    -- Recomendação
    would_hire_again BOOLEAN DEFAULT true,

    -- Controle
    reviewed_by UUID REFERENCES users(id), -- Admin que fez a avaliação
    is_visible BOOLEAN DEFAULT true, -- Visível publicamente?

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Garantir uma avaliação por profissional por projeto
    UNIQUE(project_id, professional_id)
);

-- =====================================================
-- TABELA: supplier_reviews
-- =====================================================
-- Avaliações de fornecedores após eventos

CREATE TABLE IF NOT EXISTS supplier_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Relacionamentos
    project_id UUID NOT NULL REFERENCES event_projects(id) ON DELETE CASCADE,
    quotation_id UUID NOT NULL REFERENCES supplier_quotations(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES equipment_suppliers(id) ON DELETE CASCADE,

    -- Avaliação
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,

    -- Critérios específicos (1-5)
    delivery_rating INTEGER CHECK (delivery_rating >= 1 AND delivery_rating <= 5),
    equipment_quality_rating INTEGER CHECK (equipment_quality_rating >= 1 AND equipment_quality_rating <= 5),
    service_rating INTEGER CHECK (service_rating >= 1 AND service_rating <= 5),
    price_value_rating INTEGER CHECK (price_value_rating >= 1 AND price_value_rating <= 5),

    -- Recomendação
    would_hire_again BOOLEAN DEFAULT true,

    -- Controle
    reviewed_by UUID REFERENCES users(id), -- Admin que fez a avaliação
    is_visible BOOLEAN DEFAULT true,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Garantir uma avaliação por fornecedor por projeto
    UNIQUE(project_id, supplier_id)
);

-- =====================================================
-- ÍNDICES
-- =====================================================

-- Professional Reviews
CREATE INDEX idx_professional_reviews_professional ON professional_reviews(professional_id);
CREATE INDEX idx_professional_reviews_project ON professional_reviews(project_id);
CREATE INDEX idx_professional_reviews_rating ON professional_reviews(rating);
CREATE INDEX idx_professional_reviews_visible ON professional_reviews(is_visible);
CREATE INDEX idx_professional_reviews_created ON professional_reviews(created_at DESC);

-- Supplier Reviews
CREATE INDEX idx_supplier_reviews_supplier ON supplier_reviews(supplier_id);
CREATE INDEX idx_supplier_reviews_project ON supplier_reviews(project_id);
CREATE INDEX idx_supplier_reviews_rating ON supplier_reviews(rating);
CREATE INDEX idx_supplier_reviews_visible ON supplier_reviews(is_visible);
CREATE INDEX idx_supplier_reviews_created ON supplier_reviews(created_at DESC);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_professional_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_professional_reviews_updated_at
    BEFORE UPDATE ON professional_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_professional_reviews_updated_at();

CREATE OR REPLACE FUNCTION update_supplier_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_supplier_reviews_updated_at
    BEFORE UPDATE ON supplier_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_supplier_reviews_updated_at();

-- =====================================================
-- VIEWS (para facilitar queries)
-- =====================================================

-- View: Estatísticas de avaliação por profissional
CREATE OR REPLACE VIEW professional_review_stats AS
SELECT
    p.id as professional_id,
    p.full_name,
    COUNT(pr.id) as total_reviews,
    ROUND(AVG(pr.rating), 2) as avg_rating,
    ROUND(AVG(pr.punctuality_rating), 2) as avg_punctuality,
    ROUND(AVG(pr.professionalism_rating), 2) as avg_professionalism,
    ROUND(AVG(pr.quality_rating), 2) as avg_quality,
    ROUND(AVG(pr.communication_rating), 2) as avg_communication,
    COUNT(CASE WHEN pr.would_hire_again = true THEN 1 END) as would_hire_again_count,
    ROUND(
        COUNT(CASE WHEN pr.would_hire_again = true THEN 1 END)::NUMERIC /
        NULLIF(COUNT(pr.id), 0) * 100,
        2
    ) as would_hire_again_percentage
FROM professionals p
LEFT JOIN professional_reviews pr ON p.id = pr.professional_id AND pr.is_visible = true
GROUP BY p.id, p.full_name;

-- View: Estatísticas de avaliação por fornecedor
CREATE OR REPLACE VIEW supplier_review_stats AS
SELECT
    s.id as supplier_id,
    s.company_name,
    COUNT(sr.id) as total_reviews,
    ROUND(AVG(sr.rating), 2) as avg_rating,
    ROUND(AVG(sr.delivery_rating), 2) as avg_delivery,
    ROUND(AVG(sr.equipment_quality_rating), 2) as avg_quality,
    ROUND(AVG(sr.service_rating), 2) as avg_service,
    ROUND(AVG(sr.price_value_rating), 2) as avg_price_value,
    COUNT(CASE WHEN sr.would_hire_again = true THEN 1 END) as would_hire_again_count,
    ROUND(
        COUNT(CASE WHEN sr.would_hire_again = true THEN 1 END)::NUMERIC /
        NULLIF(COUNT(sr.id), 0) * 100,
        2
    ) as would_hire_again_percentage
FROM equipment_suppliers s
LEFT JOIN supplier_reviews sr ON s.id = sr.supplier_id AND sr.is_visible = true
GROUP BY s.id, s.company_name;

-- =====================================================
-- FUNÇÕES HELPER
-- =====================================================

-- Função: Buscar avaliações recentes de um profissional
CREATE OR REPLACE FUNCTION get_professional_recent_reviews(
    p_professional_id UUID,
    p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    project_number TEXT,
    event_name TEXT,
    rating INTEGER,
    comment TEXT,
    would_hire_again BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        pr.id,
        ep.project_number,
        ep.event_name,
        pr.rating,
        pr.comment,
        pr.would_hire_again,
        pr.created_at
    FROM professional_reviews pr
    JOIN event_projects ep ON pr.project_id = ep.id
    WHERE pr.professional_id = p_professional_id
        AND pr.is_visible = true
    ORDER BY pr.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Função: Buscar avaliações recentes de um fornecedor
CREATE OR REPLACE FUNCTION get_supplier_recent_reviews(
    p_supplier_id UUID,
    p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    project_number TEXT,
    event_name TEXT,
    rating INTEGER,
    comment TEXT,
    would_hire_again BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        sr.id,
        ep.project_number,
        ep.event_name,
        sr.rating,
        sr.comment,
        sr.would_hire_again,
        sr.created_at
    FROM supplier_reviews sr
    JOIN event_projects ep ON sr.project_id = ep.id
    WHERE sr.supplier_id = p_supplier_id
        AND sr.is_visible = true
    ORDER BY sr.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMENTÁRIOS
-- =====================================================

COMMENT ON TABLE professional_reviews IS 'Avaliações de profissionais após eventos';
COMMENT ON TABLE supplier_reviews IS 'Avaliações de fornecedores após eventos';

COMMENT ON COLUMN professional_reviews.rating IS 'Avaliação geral (1-5 estrelas)';
COMMENT ON COLUMN professional_reviews.punctuality_rating IS 'Pontualidade (1-5)';
COMMENT ON COLUMN professional_reviews.professionalism_rating IS 'Profissionalismo (1-5)';
COMMENT ON COLUMN professional_reviews.quality_rating IS 'Qualidade do trabalho (1-5)';
COMMENT ON COLUMN professional_reviews.communication_rating IS 'Comunicação (1-5)';

COMMENT ON COLUMN supplier_reviews.rating IS 'Avaliação geral (1-5 estrelas)';
COMMENT ON COLUMN supplier_reviews.delivery_rating IS 'Entrega/Retirada (1-5)';
COMMENT ON COLUMN supplier_reviews.equipment_quality_rating IS 'Qualidade do equipamento (1-5)';
COMMENT ON COLUMN supplier_reviews.service_rating IS 'Atendimento (1-5)';
COMMENT ON COLUMN supplier_reviews.price_value_rating IS 'Custo-benefício (1-5)';

-- =====================================================
-- DADOS EXEMPLO (comentados - descomente para testar)
-- =====================================================

/*
-- Exemplo: Avaliar um profissional
INSERT INTO professional_reviews (
    project_id,
    team_member_id,
    professional_id,
    rating,
    comment,
    punctuality_rating,
    professionalism_rating,
    quality_rating,
    communication_rating,
    would_hire_again
) VALUES (
    'uuid-do-projeto',
    'uuid-do-team-member',
    'uuid-do-profissional',
    5,
    'Excelente profissional! Muito pontual e comunicativo.',
    5,
    5,
    5,
    5,
    true
);
*/

-- =====================================================
-- FIM DA MIGRATION
-- =====================================================
-- STATUS: ✅ BASE PRONTA
-- PRÓXIMO PASSO: Implementar APIs e componentes de UI
-- =====================================================
