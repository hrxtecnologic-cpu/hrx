-- =====================================================
-- Migration 038: Popular Categorias de Profissionais
-- =====================================================
-- Descrição: Popula categorias e subcategorias de profissionais
-- com dados atualmente hardcoded em categories-subcategories.ts
-- Total: 20 categorias, 82 subcategorias
-- =====================================================

-- =====================================================
-- LIMPAR DADOS ANTIGOS (SE EXISTIREM)
-- =====================================================

-- Deletar apenas categorias de profissionais antigas (se houver)
DELETE FROM category_subcategories
WHERE category_id IN (
  SELECT id FROM categories WHERE category_type = 'professional'
);

DELETE FROM categories WHERE category_type = 'professional';

-- =====================================================
-- POPULAR CATEGORIAS PRINCIPAIS (20)
-- =====================================================

-- 1. Alimentação e Bebidas
INSERT INTO categories (name, description, category_type, icon, color, order_index, active)
VALUES ('Alimentação e Bebidas', 'Profissionais de alimentação e serviços de bebidas', 'professional', 'utensils', '#f97316', 1, true);

-- 2. Entretenimento
INSERT INTO categories (name, description, category_type, icon, color, order_index, active)
VALUES ('Entretenimento', 'Profissionais de animação e entretenimento', 'professional', 'music', '#ec4899', 2, true);

-- 3. Apoio Operacional
INSERT INTO categories (name, description, category_type, icon, color, order_index, active)
VALUES ('Apoio Operacional', 'Profissionais de apoio e suporte operacional', 'professional', 'users', '#6366f1', 3, true);

-- 4. Decoração
INSERT INTO categories (name, description, category_type, icon, color, order_index, active)
VALUES ('Decoração', 'Profissionais de decoração e ambientação', 'professional', 'palette', '#8b5cf6', 4, true);

-- 5. Eletricidade
INSERT INTO categories (name, description, category_type, icon, color, order_index, active)
VALUES ('Eletricidade', 'Profissionais de instalações elétricas e energia', 'professional', 'zap', '#eab308', 5, true);

-- 6. Fotografia e Filmagem
INSERT INTO categories (name, description, category_type, icon, color, order_index, active)
VALUES ('Fotografia e Filmagem', 'Profissionais de fotografia e produção audiovisual', 'professional', 'camera', '#06b6d4', 6, true);

-- 7. Gestão de Resíduos
INSERT INTO categories (name, description, category_type, icon, color, order_index, active)
VALUES ('Gestão de Resíduos', 'Profissionais de limpeza e gestão ambiental', 'professional', 'recycle', '#22c55e', 7, true);

-- 8. TI
INSERT INTO categories (name, description, category_type, icon, color, order_index, active)
VALUES ('TI', 'Profissionais de tecnologia da informação', 'professional', 'monitor', '#3b82f6', 8, true);

-- 9. Limpeza
INSERT INTO categories (name, description, category_type, icon, color, order_index, active)
VALUES ('Limpeza', 'Profissionais de limpeza e conservação', 'professional', 'sparkles', '#14b8a6', 9, true);

-- 10. Montagem e Desmontagem
INSERT INTO categories (name, description, category_type, icon, color, order_index, active)
VALUES ('Montagem e Desmontagem', 'Profissionais de montagem de estruturas', 'professional', 'hammer', '#f59e0b', 10, true);

-- 11. Palco e Cenografia
INSERT INTO categories (name, description, category_type, icon, color, order_index, active)
VALUES ('Palco e Cenografia', 'Profissionais de palco e cenografia', 'professional', 'theater', '#a855f7', 11, true);

-- 12. Produção e Coordenação
INSERT INTO categories (name, description, category_type, icon, color, order_index, active)
VALUES ('Produção e Coordenação', 'Profissionais de produção e coordenação de eventos', 'professional', 'briefcase', '#ef4444', 12, true);

-- 13. Promotores
INSERT INTO categories (name, description, category_type, icon, color, order_index, active)
VALUES ('Promotores', 'Profissionais de promoção e demonstração', 'professional', 'megaphone', '#f43f5e', 13, true);

-- 14. Recepção e Credenciamento
INSERT INTO categories (name, description, category_type, icon, color, order_index, active)
VALUES ('Recepção e Credenciamento', 'Profissionais de recepção e atendimento', 'professional', 'user-check', '#0ea5e9', 14, true);

-- 15. Saúde
INSERT INTO categories (name, description, category_type, icon, color, order_index, active)
VALUES ('Saúde', 'Profissionais de saúde e atendimento médico', 'professional', 'heart-pulse', '#dc2626', 15, true);

-- 16. Segurança
INSERT INTO categories (name, description, category_type, icon, color, order_index, active)
VALUES ('Segurança', 'Profissionais de segurança patrimonial', 'professional', 'shield', '#7c3aed', 16, true);

-- 17. Técnicos Audiovisuais
INSERT INTO categories (name, description, category_type, icon, color, order_index, active)
VALUES ('Técnicos Audiovisuais', 'Técnicos de som, luz e vídeo', 'professional', 'headphones', '#2563eb', 17, true);

-- 18. Tradução
INSERT INTO categories (name, description, category_type, icon, color, order_index, active)
VALUES ('Tradução', 'Profissionais de tradução e interpretação', 'professional', 'languages', '#059669', 18, true);

-- 19. Transporte e Logística
INSERT INTO categories (name, description, category_type, icon, color, order_index, active)
VALUES ('Transporte e Logística', 'Profissionais de transporte e logística', 'professional', 'truck', '#0891b2', 19, true);

-- 20. Vendas
INSERT INTO categories (name, description, category_type, icon, color, order_index, active)
VALUES ('Vendas', 'Profissionais de vendas e bilheteria', 'professional', 'shopping-cart', '#65a30d', 20, true);

-- =====================================================
-- POPULAR SUBCATEGORIAS (82 no total)
-- =====================================================
-- Usando formato compacto para economizar espaço

-- 1. Alimentação e Bebidas (6)
INSERT INTO category_subcategories (category_id, name, slug, description, required_documents, order_index)
SELECT id, 'Auxiliar de Cozinha', 'auxiliar_cozinha', 'Apoio na cozinha', '[]', 1 FROM categories WHERE name = 'Alimentação e Bebidas';
INSERT INTO category_subcategories (category_id, name, slug, description, required_documents, order_index)
SELECT id, 'Barman/Bartender', 'barman', 'Preparo de bebidas', '[]', 2 FROM categories WHERE name = 'Alimentação e Bebidas';
INSERT INTO category_subcategories (category_id, name, slug, description, required_documents, order_index)
SELECT id, 'Chef de Cozinha', 'chef', 'Responsável pela cozinha', '["portfolio"]', 3 FROM categories WHERE name = 'Alimentação e Bebidas';
INSERT INTO category_subcategories (category_id, name, slug, description, required_documents, order_index)
SELECT id, 'Copeiro(a)', 'copeiro', 'Serviços de copa', '[]', 4 FROM categories WHERE name = 'Alimentação e Bebidas';
INSERT INTO category_subcategories (category_id, name, slug, description, required_documents, order_index)
SELECT id, 'Cozinheiro(a)', 'cozinheiro', 'Preparo de alimentos', '[]', 5 FROM categories WHERE name = 'Alimentação e Bebidas';
INSERT INTO category_subcategories (category_id, name, slug, description, required_documents, order_index)
SELECT id, 'Garçom/Garçonete', 'garcom', 'Serviço de mesa', '[]', 6 FROM categories WHERE name = 'Alimentação e Bebidas';

-- 2. Entretenimento (5)
INSERT INTO category_subcategories (category_id, name, slug, description, required_documents, order_index)
SELECT id, 'Animador(a)', 'animador', 'Animação de eventos', '[]', 1 FROM categories WHERE name = 'Entretenimento';
INSERT INTO category_subcategories (category_id, name, slug, description, required_documents, order_index)
SELECT id, 'DJ', 'dj', 'Disc Jockey', '["portfolio"]', 2 FROM categories WHERE name = 'Entretenimento';
INSERT INTO category_subcategories (category_id, name, slug, description, required_documents, order_index)
SELECT id, 'MC/Apresentador', 'mc', 'Mestre de cerimônias', '[]', 3 FROM categories WHERE name = 'Entretenimento';
INSERT INTO category_subcategories (category_id, name, slug, description, required_documents, order_index)
SELECT id, 'Músico', 'musico', 'Performance musical', '["portfolio"]', 4 FROM categories WHERE name = 'Entretenimento';
INSERT INTO category_subcategories (category_id, name, slug, description, required_documents, order_index)
SELECT id, 'Performer', 'performer', 'Performance artística', '["portfolio"]', 5 FROM categories WHERE name = 'Entretenimento';

-- 3. Apoio Operacional (4)
INSERT INTO category_subcategories (category_id, name, slug, description, required_documents, order_index) SELECT id, 'Fiscal de Sala', 'fiscal_sala', 'Organização de salas', '[]', 1 FROM categories WHERE name = 'Apoio Operacional';
INSERT INTO category_subcategories (category_id, name, slug, description, required_documents, order_index) SELECT id, 'Orientador(a)', 'orientador', 'Orientação de público', '[]', 2 FROM categories WHERE name = 'Apoio Operacional';
INSERT INTO category_subcategories (category_id, name, slug, description, required_documents, order_index) SELECT id, 'Runner', 'runner', 'Execução rápida de tarefas', '[]', 3 FROM categories WHERE name = 'Apoio Operacional';
INSERT INTO category_subcategories (category_id, name, slug, description, required_documents, order_index) SELECT id, 'Staff Geral', 'staff_geral', 'Apoio operacional geral', '[]', 4 FROM categories WHERE name = 'Apoio Operacional';

-- 4. Decoração (3)
INSERT INTO category_subcategories (category_id, name, slug, description, required_documents, order_index) SELECT id, 'Decorador(a)', 'decorador', 'Decoração de ambientes', '[]', 1 FROM categories WHERE name = 'Decoração';
INSERT INTO category_subcategories (category_id, name, slug, description, required_documents, order_index) SELECT id, 'Florista', 'florista', 'Arranjos florais', '[]', 2 FROM categories WHERE name = 'Decoração';
INSERT INTO category_subcategories (category_id, name, slug, description, required_documents, order_index) SELECT id, 'Montador de Decoração', 'montador_decoracao', 'Montagem de decoração', '[]', 3 FROM categories WHERE name = 'Decoração';

-- 5. Eletricidade (3)
INSERT INTO category_subcategories (category_id, name, slug, description, required_documents, order_index) SELECT id, 'Eletricista', 'eletricista', 'Instalações elétricas', '[]', 1 FROM categories WHERE name = 'Eletricidade';
INSERT INTO category_subcategories (category_id, name, slug, description, required_documents, order_index) SELECT id, 'Eletricista (NR10)', 'eletricista_nr10', 'Trabalho em alta tensão', '["nr10"]', 2 FROM categories WHERE name = 'Eletricidade';
INSERT INTO category_subcategories (category_id, name, slug, description, required_documents, order_index) SELECT id, 'Operador de Gerador', 'gerador_operador', 'Operação de geradores', '[]', 3 FROM categories WHERE name = 'Eletricidade';

-- 6. Fotografia e Filmagem (4)
INSERT INTO category_subcategories (category_id, name, slug, description, required_documents, order_index) SELECT id, 'Fotógrafo', 'fotografo', 'Fotografia profissional', '["portfolio"]', 1 FROM categories WHERE name = 'Fotografia e Filmagem';
INSERT INTO category_subcategories (category_id, name, slug, description, required_documents, order_index) SELECT id, 'Operador de Câmera', 'camera_operator', 'Operação de câmeras de vídeo', '[]', 2 FROM categories WHERE name = 'Fotografia e Filmagem';
INSERT INTO category_subcategories (category_id, name, slug, description, required_documents, order_index) SELECT id, 'Piloto de Drone', 'drone_pilot', 'Filmagem aérea com drone', '["certificado_anac"]', 3 FROM categories WHERE name = 'Fotografia e Filmagem';
INSERT INTO category_subcategories (category_id, name, slug, description, required_documents, order_index) SELECT id, 'Videomaker', 'videomaker', 'Captação e edição de vídeo', '["portfolio"]', 4 FROM categories WHERE name = 'Fotografia e Filmagem';

-- 7. Gestão de Resíduos (2)
INSERT INTO category_subcategories (category_id, name, slug, description, required_documents, order_index) SELECT id, 'Coletor de Resíduos', 'coletor_residuos', 'Coleta de lixo e reciclagem', '[]', 1 FROM categories WHERE name = 'Gestão de Resíduos';
INSERT INTO category_subcategories (category_id, name, slug, description, required_documents, order_index) SELECT id, 'Supervisor Ambiental', 'supervisor_ambiental', 'Supervisão de gestão ambiental', '[]', 2 FROM categories WHERE name = 'Gestão de Resíduos';

-- 8. TI (3)
INSERT INTO category_subcategories (category_id, name, slug, description, required_documents, order_index) SELECT id, 'Operador de Sistemas', 'operador_sistemas', 'Operação de sistemas', '[]', 1 FROM categories WHERE name = 'TI';
INSERT INTO category_subcategories (category_id, name, slug, description, required_documents, order_index) SELECT id, 'Suporte de TI', 'suporte_ti', 'Suporte técnico de informática', '[]', 2 FROM categories WHERE name = 'TI';
INSERT INTO category_subcategories (category_id, name, slug, description, required_documents, order_index) SELECT id, 'Técnico de Informática', 'tecnico_informatica', 'Manutenção de equipamentos', '[]', 3 FROM categories WHERE name = 'TI';

-- 9. Limpeza (3)
INSERT INTO category_subcategories (category_id, name, slug, description, required_documents, order_index) SELECT id, 'Auxiliar de Limpeza', 'auxiliar_limpeza', 'Limpeza geral', '[]', 1 FROM categories WHERE name = 'Limpeza';
INSERT INTO category_subcategories (category_id, name, slug, description, required_documents, order_index) SELECT id, 'Gari', 'gari', 'Limpeza de áreas externas', '[]', 2 FROM categories WHERE name = 'Limpeza';
INSERT INTO category_subcategories (category_id, name, slug, description, required_documents, order_index) SELECT id, 'Supervisor de Limpeza', 'supervisor_limpeza', 'Supervisão de equipe de limpeza', '[]', 3 FROM categories WHERE name = 'Limpeza';

-- 10. Montagem e Desmontagem (4)
INSERT INTO category_subcategories (category_id, name, slug, description, required_documents, order_index) SELECT id, 'Ajudante Geral', 'ajudante_geral', 'Apoio geral em montagem', '[]', 1 FROM categories WHERE name = 'Montagem e Desmontagem';
INSERT INTO category_subcategories (category_id, name, slug, description, required_documents, order_index) SELECT id, 'Carpinteiro', 'carpinteiro', 'Serviços de carpintaria', '[]', 2 FROM categories WHERE name = 'Montagem e Desmontagem';
INSERT INTO category_subcategories (category_id, name, slug, description, required_documents, order_index) SELECT id, 'Montador', 'montador', 'Montagem de estruturas', '[]', 3 FROM categories WHERE name = 'Montagem e Desmontagem';
INSERT INTO category_subcategories (category_id, name, slug, description, required_documents, order_index) SELECT id, 'Montador (NR35)', 'montador_nr35', 'Montador com trabalho em altura', '["nr35"]', 4 FROM categories WHERE name = 'Montagem e Desmontagem';

-- Continuando...

-- 11. Palco e Cenografia (4)
INSERT INTO category_subcategories (category_id, name, slug, description, required_documents, order_index) SELECT id, 'Cenógrafo', 'cenografo', 'Criação e montagem de cenários', '[]', 1 FROM categories WHERE name = 'Palco e Cenografia';
INSERT INTO category_subcategories (category_id, name, slug, description, required_documents, order_index) SELECT id, 'Cenotécnico', 'cenotecnico', 'Execução técnica de cenografia', '[]', 2 FROM categories WHERE name = 'Palco e Cenografia';
INSERT INTO category_subcategories (category_id, name, slug, description, required_documents, order_index) SELECT id, 'Contra-regra', 'contra_regra', 'Organização de palco e bastidores', '[]', 3 FROM categories WHERE name = 'Palco e Cenografia';
INSERT INTO category_subcategories (category_id, name, slug, description, required_documents, order_index) SELECT id, 'Operador de Fly', 'operador_fly', 'Operação de sistemas aéreos', '["nr35"]', 4 FROM categories WHERE name = 'Palco e Cenografia';

-- 12. Produção e Coordenação (4)
INSERT INTO category_subcategories (category_id, name, slug, description, required_documents, order_index) SELECT id, 'Assistente de Produção', 'assistente_producao', 'Apoio à produção', '[]', 1 FROM categories WHERE name = 'Produção e Coordenação';
INSERT INTO category_subcategories (category_id, name, slug, description, required_documents, order_index) SELECT id, 'Coordenador de Evento', 'coordenador_evento', 'Coordenação operacional do evento', '[]', 2 FROM categories WHERE name = 'Produção e Coordenação';
INSERT INTO category_subcategories (category_id, name, slug, description, required_documents, order_index) SELECT id, 'Produtor Executivo', 'produtor_executivo', 'Coordenação geral do evento', '[]', 3 FROM categories WHERE name = 'Produção e Coordenação';
INSERT INTO category_subcategories (category_id, name, slug, description, required_documents, order_index) SELECT id, 'Supervisor Operacional', 'supervisor_operacional', 'Supervisão de equipes operacionais', '[]', 4 FROM categories WHERE name = 'Produção e Coordenação';

-- 13. Promotores (4)
INSERT INTO category_subcategories (category_id, name, slug, description, required_documents, order_index) SELECT id, 'Demonstrador(a)', 'demonstrador', 'Demonstração de produtos', '[]', 1 FROM categories WHERE name = 'Promotores';
INSERT INTO category_subcategories (category_id, name, slug, description, required_documents, order_index) SELECT id, 'Panfleteiro(a)', 'panfleteiro', 'Distribuição de material', '[]', 2 FROM categories WHERE name = 'Promotores';
INSERT INTO category_subcategories (category_id, name, slug, description, required_documents, order_index) SELECT id, 'Promotor(a) de Vendas', 'promotor_vendas', 'Promoção de produtos', '[]', 3 FROM categories WHERE name = 'Promotores';
INSERT INTO category_subcategories (category_id, name, slug, description, required_documents, order_index) SELECT id, 'Repositor(a)', 'repositor', 'Reposição de produtos', '[]', 4 FROM categories WHERE name = 'Promotores';

-- 14. Recepção e Credenciamento (4)
INSERT INTO category_subcategories (category_id, name, slug, description, required_documents, order_index) SELECT id, 'Concierge', 'concierge', 'Atendimento VIP e informações', '[]', 1 FROM categories WHERE name = 'Recepção e Credenciamento';
INSERT INTO category_subcategories (category_id, name, slug, description, required_documents, order_index) SELECT id, 'Credenciador', 'credenciador', 'Credenciamento de participantes', '[]', 2 FROM categories WHERE name = 'Recepção e Credenciamento';
INSERT INTO category_subcategories (category_id, name, slug, description, required_documents, order_index) SELECT id, 'Hostess/Host', 'hostess', 'Recepção e orientação de convidados', '[]', 3 FROM categories WHERE name = 'Recepção e Credenciamento';
INSERT INTO category_subcategories (category_id, name, slug, description, required_documents, order_index) SELECT id, 'Recepcionista', 'recepcionista', 'Recepção e atendimento', '[]', 4 FROM categories WHERE name = 'Recepção e Credenciamento';

-- 15. Saúde (5)
INSERT INTO category_subcategories (category_id, name, slug, description, required_documents, order_index) SELECT id, 'Brigadista', 'brigadista', 'Brigada de incêndio', '["nr23"]', 1 FROM categories WHERE name = 'Saúde';
INSERT INTO category_subcategories (category_id, name, slug, description, required_documents, order_index) SELECT id, 'Enfermeiro(a)', 'enfermeiro', 'Atendimento de enfermagem', '["coren"]', 2 FROM categories WHERE name = 'Saúde';
INSERT INTO category_subcategories (category_id, name, slug, description, required_documents, order_index) SELECT id, 'Médico(a)', 'medico', 'Atendimento médico', '["crm"]', 3 FROM categories WHERE name = 'Saúde';
INSERT INTO category_subcategories (category_id, name, slug, description, required_documents, order_index) SELECT id, 'Socorrista', 'socorrista', 'Primeiros socorros', '["curso_primeiros_socorros"]', 4 FROM categories WHERE name = 'Saúde';
INSERT INTO category_subcategories (category_id, name, slug, description, required_documents, order_index) SELECT id, 'Técnico de Enfermagem', 'tecnico_enfermagem', 'Suporte de enfermagem', '["coren"]', 5 FROM categories WHERE name = 'Saúde';

-- 16. Segurança (5)
INSERT INTO category_subcategories (category_id, name, slug, description, required_documents, order_index) SELECT id, 'Controlador de Acesso', 'controlador_acesso', 'Controle de entrada e saída', '[]', 1 FROM categories WHERE name = 'Segurança';
INSERT INTO category_subcategories (category_id, name, slug, description, required_documents, order_index) SELECT id, 'Porteiro', 'porteiro', 'Portaria e recepção de acessos', '[]', 2 FROM categories WHERE name = 'Segurança';
INSERT INTO category_subcategories (category_id, name, slug, description, required_documents, order_index) SELECT id, 'Segurança Patrimonial', 'seguranca_patrimonial', 'Segurança desarmado', '[]', 3 FROM categories WHERE name = 'Segurança';
INSERT INTO category_subcategories (category_id, name, slug, description, required_documents, order_index) SELECT id, 'Segurança Pessoal', 'seguranca_pessoal', 'Proteção de pessoas VIP', '["cnv"]', 4 FROM categories WHERE name = 'Segurança';
INSERT INTO category_subcategories (category_id, name, slug, description, required_documents, order_index) SELECT id, 'Vigilante', 'vigilante', 'Vigilante com CNV', '["cnv"]', 5 FROM categories WHERE name = 'Segurança';

-- 17. Técnicos Audiovisuais (5)
INSERT INTO category_subcategories (category_id, name, slug, description, required_documents, order_index) SELECT id, 'Operador de Projetor', 'operador_projetor', 'Operação de projetores', '[]', 1 FROM categories WHERE name = 'Técnicos Audiovisuais';
INSERT INTO category_subcategories (category_id, name, slug, description, required_documents, order_index) SELECT id, 'Operador de Streaming', 'streaming_operator', 'Transmissão online de eventos', '[]', 2 FROM categories WHERE name = 'Técnicos Audiovisuais';
INSERT INTO category_subcategories (category_id, name, slug, description, required_documents, order_index) SELECT id, 'Técnico de Iluminação', 'tec_iluminacao', 'Operação de equipamentos de iluminação', '["drt"]', 3 FROM categories WHERE name = 'Técnicos Audiovisuais';
INSERT INTO category_subcategories (category_id, name, slug, description, required_documents, order_index) SELECT id, 'Técnico de Som', 'tec_som', 'Operação de equipamentos de áudio', '["drt"]', 4 FROM categories WHERE name = 'Técnicos Audiovisuais';
INSERT INTO category_subcategories (category_id, name, slug, description, required_documents, order_index) SELECT id, 'Técnico de Vídeo', 'tec_video', 'Operação de câmeras e vídeo', '["drt"]', 5 FROM categories WHERE name = 'Técnicos Audiovisuais';

-- 18. Tradução (3)
INSERT INTO category_subcategories (category_id, name, slug, description, required_documents, order_index) SELECT id, 'Intérprete de LIBRAS', 'interprete_libras', 'Tradução para língua de sinais', '["certificado_libras"]', 1 FROM categories WHERE name = 'Tradução';
INSERT INTO category_subcategories (category_id, name, slug, description, required_documents, order_index) SELECT id, 'Intérprete Simultâneo', 'interprete_simultaneo', 'Tradução simultânea', '["certificado_traducao"]', 2 FROM categories WHERE name = 'Tradução';
INSERT INTO category_subcategories (category_id, name, slug, description, required_documents, order_index) SELECT id, 'Tradutor', 'tradutor', 'Tradução de textos', '[]', 3 FROM categories WHERE name = 'Tradução';

-- 19. Transporte e Logística (6)
INSERT INTO category_subcategories (category_id, name, slug, description, required_documents, order_index) SELECT id, 'Auxiliar de Logística', 'auxiliar_logistica', 'Apoio logístico', '[]', 1 FROM categories WHERE name = 'Transporte e Logística';
INSERT INTO category_subcategories (category_id, name, slug, description, required_documents, order_index) SELECT id, 'Manobrista', 'manobrista', 'Serviço de valet', '["cnh"]', 2 FROM categories WHERE name = 'Transporte e Logística';
INSERT INTO category_subcategories (category_id, name, slug, description, required_documents, order_index) SELECT id, 'Motorista (Cat. B)', 'motorista_cat_b', 'Carros de passeio', '["cnh"]', 3 FROM categories WHERE name = 'Transporte e Logística';
INSERT INTO category_subcategories (category_id, name, slug, description, required_documents, order_index) SELECT id, 'Motorista (Cat. D)', 'motorista_cat_d', 'Ônibus e vans', '["cnh"]', 4 FROM categories WHERE name = 'Transporte e Logística';
INSERT INTO category_subcategories (category_id, name, slug, description, required_documents, order_index) SELECT id, 'Motorista (Cat. E)', 'motorista_cat_e', 'Caminhões e carretas', '["cnh"]', 5 FROM categories WHERE name = 'Transporte e Logística';
INSERT INTO category_subcategories (category_id, name, slug, description, required_documents, order_index) SELECT id, 'Operador de Empilhadeira', 'operador_empilhadeira', 'Operação de empilhadeira', '["cnh", "curso_empilhadeira"]', 6 FROM categories WHERE name = 'Transporte e Logística';

-- 20. Vendas (3)
INSERT INTO category_subcategories (category_id, name, slug, description, required_documents, order_index) SELECT id, 'Bilheteiro(a)', 'bilheteiro', 'Venda de ingressos', '[]', 1 FROM categories WHERE name = 'Vendas';
INSERT INTO category_subcategories (category_id, name, slug, description, required_documents, order_index) SELECT id, 'Operador(a) de Caixa', 'operador_caixa', 'Operação de caixa', '[]', 2 FROM categories WHERE name = 'Vendas';
INSERT INTO category_subcategories (category_id, name, slug, description, required_documents, order_index) SELECT id, 'Vendedor(a)', 'vendedor', 'Vendas em geral', '[]', 3 FROM categories WHERE name = 'Vendas';

-- =====================================================
-- RESUMO E VERIFICAÇÃO
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ População concluída com sucesso!';
  RAISE NOTICE 'Total de categorias profissionais: %', (SELECT COUNT(*) FROM categories WHERE category_type = 'professional');
  RAISE NOTICE 'Total de subcategorias: %', (SELECT COUNT(*) FROM category_subcategories);
END $$;

-- =====================================================
-- FIM DA MIGRATION
-- =====================================================
