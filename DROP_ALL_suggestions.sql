-- =====================================================
-- LIMPAR TODAS AS FUNÇÕES DE SUGESTÕES
-- =====================================================
-- Execute PRIMEIRO este script para limpar tudo
-- =====================================================

DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop todas as versões de get_suggested_professionals
    FOR r IN (
        SELECT oid::regprocedure
        FROM pg_proc
        WHERE proname = 'get_suggested_professionals'
    ) LOOP
        EXECUTE 'DROP FUNCTION ' || r.oid::regprocedure || ' CASCADE';
        RAISE NOTICE 'Dropped: %', r.oid::regprocedure;
    END LOOP;

    -- Drop todas as versões de calculate_professional_score
    FOR r IN (
        SELECT oid::regprocedure
        FROM pg_proc
        WHERE proname = 'calculate_professional_score'
    ) LOOP
        EXECUTE 'DROP FUNCTION ' || r.oid::regprocedure || ' CASCADE';
        RAISE NOTICE 'Dropped: %', r.oid::regprocedure;
    END LOOP;

    -- Drop todas as versões de get_nearby_professionals
    FOR r IN (
        SELECT oid::regprocedure
        FROM pg_proc
        WHERE proname = 'get_nearby_professionals'
    ) LOOP
        EXECUTE 'DROP FUNCTION ' || r.oid::regprocedure || ' CASCADE';
        RAISE NOTICE 'Dropped: %', r.oid::regprocedure;
    END LOOP;

    -- Drop todas as versões de get_suggested_suppliers
    FOR r IN (
        SELECT oid::regprocedure
        FROM pg_proc
        WHERE proname = 'get_suggested_suppliers'
    ) LOOP
        EXECUTE 'DROP FUNCTION ' || r.oid::regprocedure || ' CASCADE';
        RAISE NOTICE 'Dropped: %', r.oid::regprocedure;
    END LOOP;

    -- Drop todas as versões de calculate_supplier_score
    FOR r IN (
        SELECT oid::regprocedure
        FROM pg_proc
        WHERE proname = 'calculate_supplier_score'
    ) LOOP
        EXECUTE 'DROP FUNCTION ' || r.oid::regprocedure || ' CASCADE';
        RAISE NOTICE 'Dropped: %', r.oid::regprocedure;
    END LOOP;

    -- Drop todas as versões de get_nearby_suppliers
    FOR r IN (
        SELECT oid::regprocedure
        FROM pg_proc
        WHERE proname = 'get_nearby_suppliers'
    ) LOOP
        EXECUTE 'DROP FUNCTION ' || r.oid::regprocedure || ' CASCADE';
        RAISE NOTICE 'Dropped: %', r.oid::regprocedure;
    END LOOP;

    RAISE NOTICE '';
    RAISE NOTICE '✅ Todas as funções antigas foram removidas!';
    RAISE NOTICE '👉 Agora execute: FINAL_fix_suggestions.sql';
    RAISE NOTICE '';
END $$;
