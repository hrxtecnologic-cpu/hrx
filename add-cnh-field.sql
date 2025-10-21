-- Adicionar campos de controle de validade de documentos
-- Execute este SQL no Supabase SQL Editor

-- Adicionar coluna cnh_number (apenas se não existir)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'professionals'
        AND column_name = 'cnh_number'
    ) THEN
        ALTER TABLE professionals ADD COLUMN cnh_number VARCHAR(20);
    END IF;
END $$;

-- Adicionar coluna cnh_validity (apenas se não existir)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'professionals'
        AND column_name = 'cnh_validity'
    ) THEN
        ALTER TABLE professionals ADD COLUMN cnh_validity DATE;
    END IF;
END $$;

-- Adicionar coluna cnv_validity (apenas se não existir)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'professionals'
        AND column_name = 'cnv_validity'
    ) THEN
        ALTER TABLE professionals ADD COLUMN cnv_validity DATE;
    END IF;
END $$;

-- Adicionar coluna nr10_validity (apenas se não existir)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'professionals'
        AND column_name = 'nr10_validity'
    ) THEN
        ALTER TABLE professionals ADD COLUMN nr10_validity DATE;
    END IF;
END $$;

-- Adicionar coluna nr35_validity (apenas se não existir)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'professionals'
        AND column_name = 'nr35_validity'
    ) THEN
        ALTER TABLE professionals ADD COLUMN nr35_validity DATE;
    END IF;
END $$;

-- Adicionar coluna drt_validity (apenas se não existir)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'professionals'
        AND column_name = 'drt_validity'
    ) THEN
        ALTER TABLE professionals ADD COLUMN drt_validity DATE;
    END IF;
END $$;

-- Comentários explicativos
COMMENT ON COLUMN professionals.cnh_number IS 'Número da Carteira Nacional de Habilitação (obrigatório para motoristas)';
COMMENT ON COLUMN professionals.cnh_validity IS 'Data de validade da CNH';
COMMENT ON COLUMN professionals.cnv_validity IS 'Data de validade da Carteira Nacional de Vigilante (obrigatório para seguranças)';
COMMENT ON COLUMN professionals.nr10_validity IS 'Data de validade do certificado NR-10';
COMMENT ON COLUMN professionals.nr35_validity IS 'Data de validade do certificado NR-35';
COMMENT ON COLUMN professionals.drt_validity IS 'Data de validade do DRT';
