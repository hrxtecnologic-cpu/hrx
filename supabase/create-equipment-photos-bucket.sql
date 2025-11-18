-- ============================================================================
-- Script: Criar Bucket para Fotos de Equipamentos
-- ============================================================================
-- Data: 2025-11-17
-- Propósito: Criar bucket público para armazenar fotos de equipamentos
-- Uso: Executar no SQL Editor do Supabase Dashboard
-- ============================================================================

-- Criar bucket para fotos de equipamentos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'equipment-photos',
  'equipment-photos',
  true, -- Bucket público (fotos podem ser vistas por todos)
  5242880, -- 5MB em bytes
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Mensagem de confirmação
SELECT 'Bucket equipment-photos criado com sucesso!' as message;

-- Verificar se o bucket foi criado
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id = 'equipment-photos';
