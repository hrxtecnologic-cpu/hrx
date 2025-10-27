-- =====================================================
-- SEED COMPLETO: HRX Eventos Platform
-- =====================================================
-- Popula o banco com dados COMPLETOS para testes
-- Inclui: Profissionais, Fornecedores, Projetos com Equipes e Equipamentos
-- =====================================================

BEGIN;

-- =====================================================
-- 1. USUARIOS (Clerk IDs simulados)
-- =====================================================

-- Admin
INSERT INTO users (clerk_id, email, full_name, user_type, status) VALUES
('user_admin_hrx_001', 'admin@hrxeventos.com.br', 'Admin HRX', 'admin', 'active');

-- Profissionais (10 profissionais)
INSERT INTO users (clerk_id, email, full_name, user_type, status) VALUES
('user_prof_001', 'joao.silva@email.com', 'João Silva', 'professional', 'active'),
('user_prof_002', 'maria.santos@email.com', 'Maria Santos', 'professional', 'active'),
('user_prof_003', 'carlos.oliveira@email.com', 'Carlos Oliveira', 'professional', 'active'),
('user_prof_004', 'ana.costa@email.com', 'Ana Costa', 'professional', 'active'),
('user_prof_005', 'pedro.ferreira@email.com', 'Pedro Ferreira', 'professional', 'active'),
('user_prof_006', 'julia.rodrigues@email.com', 'Julia Rodrigues', 'professional', 'active'),
('user_prof_007', 'lucas.almeida@email.com', 'Lucas Almeida', 'professional', 'active'),
('user_prof_008', 'fernanda.lima@email.com', 'Fernanda Lima', 'professional', 'active'),
('user_prof_009', 'rafael.martins@email.com', 'Rafael Martins', 'professional', 'active'),
('user_prof_010', 'camila.souza@email.com', 'Camila Souza', 'professional', 'active');

-- Fornecedores (5 fornecedores)
INSERT INTO users (clerk_id, email, full_name, user_type, status) VALUES
('user_supp_001', 'contato@somluzpro.com', 'Som e Luz Pro', 'supplier', 'active'),
('user_supp_002', 'vendas@eventostech.com', 'Eventos Tech', 'supplier', 'active'),
('user_supp_003', 'locacao@palcoecia.com', 'Palco e Cia', 'supplier', 'active'),
('user_supp_004', 'contato@audiovisual.com', 'Audiovisual RJ', 'supplier', 'active'),
('user_supp_005', 'eventos@megasom.com', 'Mega Som Eventos', 'supplier', 'active');

-- =====================================================
-- 2. PROFISSIONAIS COMPLETOS (com documentos, coords, categorias)
-- =====================================================

INSERT INTO professionals (
  user_id, clerk_id, full_name, cpf, birth_date, email, phone,
  cep, street, number, complement, neighborhood, city, state,
  latitude, longitude,
  categories, subcategories, certifications,
  has_experience, experience_years, experience_description,
  availability, documents, portfolio_urls,
  status, approved_at
) VALUES

-- Profissional 1: Eletricista com NR10 (Rio de Janeiro)
(
  (SELECT id FROM users WHERE clerk_id = 'user_prof_001'),
  'user_prof_001',
  'João Silva',
  '123.456.789-00',
  '1985-03-15',
  'joao.silva@email.com',
  '(21) 98765-4321',
  '20040-020',
  'Avenida Rio Branco',
  '156',
  'Sala 301',
  'Centro',
  'Rio de Janeiro',
  'RJ',
  -22.9068,
  -43.1729,
  '["Técnica"]',
  '{"Técnica": ["Elétrica", "Iluminação"]}',
  '{"nr10": {"document_url": "https://example.com/nr10.pdf", "validity_date": "2025-12-31", "issued_date": "2023-01-15"}}',
  true,
  '10',
  'Eletricista especializado em eventos com certificação NR10. Experiência em montagem de estruturas elétricas temporárias.',
  '{"weekdays": true, "weekends": true, "holidays": true, "night": true, "travel": true}',
  '{"rg_front": "https://placehold.co/600x400/png?text=RG+Frente", "rg_back": "https://placehold.co/600x400/png?text=RG+Verso", "cpf": "https://placehold.co/600x400/png?text=CPF", "proof_of_address": "https://placehold.co/600x400/png?text=Comprovante"}',
  '["https://placehold.co/400x300/png?text=Portfolio+1", "https://placehold.co/400x300/png?text=Portfolio+2"]',
  'approved',
  NOW() - INTERVAL '30 days'
),

-- Profissional 2: Rigger com NR35 (São Paulo)
(
  (SELECT id FROM users WHERE clerk_id = 'user_prof_002'),
  'user_prof_002',
  'Maria Santos',
  '987.654.321-00',
  '1990-07-22',
  'maria.santos@email.com',
  '(11) 97654-3210',
  '01310-100',
  'Avenida Paulista',
  '1578',
  NULL,
  'Bela Vista',
  'São Paulo',
  'SP',
  -23.5505,
  -46.6333,
  '["Técnica"]',
  '{"Técnica": ["Estruturas", "Rigging"]}',
  '{"nr35": {"document_url": "https://example.com/nr35.pdf", "validity_date": "2026-06-30", "issued_date": "2024-06-30"}}',
  true,
  '8',
  'Profissional certificada em trabalho em altura (NR35). Experiência em montagem de estruturas aéreas e rigging para grandes eventos.',
  '{"weekdays": true, "weekends": true, "holidays": true, "night": true, "travel": true}',
  '{"rg_front": "https://placehold.co/600x400/png?text=RG+Frente", "rg_back": "https://placehold.co/600x400/png?text=RG+Verso", "cpf": "https://placehold.co/600x400/png?text=CPF", "proof_of_address": "https://placehold.co/600x400/png?text=Comprovante"}',
  '["https://placehold.co/400x300/png?text=Rigging+1", "https://placehold.co/400x300/png?text=Rigging+2", "https://placehold.co/400x300/png?text=Rigging+3"]',
  'approved',
  NOW() - INTERVAL '25 days'
),

-- Profissional 3: Motorista com CNH D (Rio de Janeiro)
(
  (SELECT id FROM users WHERE clerk_id = 'user_prof_003'),
  'user_prof_003',
  'Carlos Oliveira',
  '456.789.123-00',
  '1982-11-08',
  'carlos.oliveira@email.com',
  '(21) 96543-2109',
  '22640-100',
  'Avenida das Américas',
  '3500',
  'Bloco 2',
  'Barra da Tijuca',
  'Rio de Janeiro',
  'RJ',
  -23.0045,
  -43.3645,
  '["Transporte"]',
  '{"Transporte": ["Caminhão", "Van"]}',
  '{}',
  true,
  '15',
  'Motorista profissional categoria D. Experiência em transporte de equipamentos para eventos.',
  '{"weekdays": true, "weekends": true, "holidays": false, "night": false, "travel": true}',
  '{"rg_front": "https://placehold.co/600x400/png?text=RG+Frente", "rg_back": "https://placehold.co/600x400/png?text=RG+Verso", "cpf": "https://placehold.co/600x400/png?text=CPF", "proof_of_address": "https://placehold.co/600x400/png?text=Comprovante"}',
  '[]',
  'approved',
  NOW() - INTERVAL '20 days'
),

-- Profissional 4: Segurança (Rio de Janeiro)
(
  (SELECT id FROM users WHERE clerk_id = 'user_prof_004'),
  'user_prof_004',
  'Ana Costa',
  '321.654.987-00',
  '1995-02-14',
  'ana.costa@email.com',
  '(21) 95432-1098',
  '20230-015',
  'Rua do Catete',
  '228',
  'Apto 102',
  'Catete',
  'Rio de Janeiro',
  'RJ',
  -22.9256,
  -43.1773,
  '["Segurança"]',
  '{"Segurança": ["Eventos", "Patrimonial"]}',
  '{}',
  true,
  '6',
  'Segurança de eventos com curso de primeiros socorros.',
  '{"weekdays": true, "weekends": true, "holidays": true, "night": true, "travel": false}',
  '{"rg_front": "https://placehold.co/600x400/png?text=RG+Frente", "rg_back": "https://placehold.co/600x400/png?text=RG+Verso", "cpf": "https://placehold.co/600x400/png?text=CPF", "proof_of_address": "https://placehold.co/600x400/png?text=Comprovante"}',
  '[]',
  'approved',
  NOW() - INTERVAL '15 days'
),

-- Profissional 5: Fotógrafo (São Paulo)
(
  (SELECT id FROM users WHERE clerk_id = 'user_prof_005'),
  'user_prof_005',
  'Pedro Ferreira',
  '789.123.456-00',
  '1988-09-30',
  'pedro.ferreira@email.com',
  '(11) 94321-0987',
  '04543-011',
  'Avenida Brigadeiro Faria Lima',
  '2232',
  NULL,
  'Itaim Bibi',
  'São Paulo',
  'SP',
  -23.5815,
  -46.6870,
  '["Produção"]',
  '{"Produção": ["Fotografia", "Audiovisual"]}',
  '{}',
  true,
  '12',
  'Fotógrafo de eventos corporativos e sociais. Especialização em cobertura de shows e festivais.',
  '{"weekdays": true, "weekends": true, "holidays": true, "night": true, "travel": true}',
  '{"rg_front": "https://placehold.co/600x400/png?text=RG+Frente", "rg_back": "https://placehold.co/600x400/png?text=RG+Verso", "cpf": "https://placehold.co/600x400/png?text=CPF", "proof_of_address": "https://placehold.co/600x400/png?text=Comprovante"}',
  '["https://placehold.co/400x300/png?text=Foto+1", "https://placehold.co/400x300/png?text=Foto+2", "https://placehold.co/400x300/png?text=Foto+3", "https://placehold.co/400x300/png?text=Foto+4"]',
  'approved',
  NOW() - INTERVAL '40 days'
),

-- Profissional 6: Coordenador de Produção (Rio de Janeiro)
(
  (SELECT id FROM users WHERE clerk_id = 'user_prof_006'),
  'user_prof_006',
  'Julia Rodrigues',
  '654.321.789-00',
  '1987-05-18',
  'julia.rodrigues@email.com',
  '(21) 93210-9876',
  '22250-040',
  'Rua Visconde de Pirajá',
  '550',
  NULL,
  'Ipanema',
  'Rio de Janeiro',
  'RJ',
  -22.9838,
  -43.2096,
  '["Produção"]',
  '{"Produção": ["Coordenação", "Gestão"]}',
  '{}',
  true,
  '15',
  'Coordenadora de produção com ampla experiência em eventos corporativos, culturais e esportivos.',
  '{"weekdays": true, "weekends": true, "holidays": false, "night": false, "travel": true}',
  '{"rg_front": "https://placehold.co/600x400/png?text=RG+Frente", "rg_back": "https://placehold.co/600x400/png?text=RG+Verso", "cpf": "https://placehold.co/600x400/png?text=CPF", "proof_of_address": "https://placehold.co/600x400/png?text=Comprovante"}',
  '[]',
  'approved',
  NOW() - INTERVAL '50 days'
),

-- Profissional 7: Técnico de Som (São Paulo)
(
  (SELECT id FROM users WHERE clerk_id = 'user_prof_007'),
  'user_prof_007',
  'Lucas Almeida',
  '147.258.369-00',
  '1992-12-25',
  'lucas.almeida@email.com',
  '(11) 92109-8765',
  '05437-010',
  'Rua dos Pinheiros',
  '498',
  NULL,
  'Pinheiros',
  'São Paulo',
  'SP',
  -23.5629,
  -46.6917,
  '["Técnica"]',
  '{"Técnica": ["Áudio", "Sonorização"]}',
  '{}',
  true,
  '9',
  'Técnico de som especializado em shows e eventos musicais. Experiência com mixagem ao vivo.',
  '{"weekdays": false, "weekends": true, "holidays": true, "night": true, "travel": true}',
  '{"rg_front": "https://placehold.co/600x400/png?text=RG+Frente", "rg_back": "https://placehold.co/600x400/png?text=RG+Verso", "cpf": "https://placehold.co/600x400/png?text=CPF", "proof_of_address": "https://placehold.co/600x400/png?text=Comprovante"}',
  '["https://placehold.co/400x300/png?text=Som+1", "https://placehold.co/400x300/png?text=Som+2"]',
  'approved',
  NOW() - INTERVAL '35 days'
),

-- Profissional 8: Cenotécnico (Rio de Janeiro)
(
  (SELECT id FROM users WHERE clerk_id = 'user_prof_008'),
  'user_prof_008',
  'Fernanda Lima',
  '258.369.147-00',
  '1991-04-12',
  'fernanda.lima@email.com',
  '(21) 91098-7654',
  '22430-160',
  'Rua Nascimento Silva',
  '107',
  NULL,
  'Ipanema',
  'Rio de Janeiro',
  'RJ',
  -22.9858,
  -43.2086,
  '["Técnica"]',
  '{"Técnica": ["Cenografia", "Montagem"]}',
  '{}',
  true,
  '7',
  'Cenotécnica com experiência em montagem de cenários para teatro e eventos.',
  '{"weekdays": true, "weekends": true, "holidays": true, "night": true, "travel": false}',
  '{"rg_front": "https://placehold.co/600x400/png?text=RG+Frente", "rg_back": "https://placehold.co/600x400/png?text=RG+Verso", "cpf": "https://placehold.co/600x400/png?text=CPF", "proof_of_address": "https://placehold.co/600x400/png?text=Comprovante"}',
  '[]',
  'approved',
  NOW() - INTERVAL '45 days'
),

-- Profissional 9: Iluminador (São Paulo)
(
  (SELECT id FROM users WHERE clerk_id = 'user_prof_009'),
  'user_prof_009',
  'Rafael Martins',
  '369.147.258-00',
  '1989-08-07',
  'rafael.martins@email.com',
  '(11) 90987-6543',
  '01452-000',
  'Rua Haddock Lobo',
  '595',
  NULL,
  'Jardins',
  'São Paulo',
  'SP',
  -23.5665,
  -46.6643,
  '["Técnica"]',
  '{"Técnica": ["Iluminação", "Luz"]}',
  '{}',
  true,
  '11',
  'Iluminador profissional com experiência em shows, teatros e eventos corporativos.',
  '{"weekdays": true, "weekends": true, "holidays": true, "night": true, "travel": true}',
  '{"rg_front": "https://placehold.co/600x400/png?text=RG+Frente", "rg_back": "https://placehold.co/600x400/png?text=RG+Verso", "cpf": "https://placehold.co/600x400/png?text=CPF", "proof_of_address": "https://placehold.co/600x400/png?text=Comprovante"}',
  '["https://placehold.co/400x300/png?text=Luz+1", "https://placehold.co/400x300/png?text=Luz+2", "https://placehold.co/400x300/png?text=Luz+3"]',
  'approved',
  NOW() - INTERVAL '60 days'
),

-- Profissional 10: Operador de Câmera (Rio de Janeiro)
(
  (SELECT id FROM users WHERE clerk_id = 'user_prof_010'),
  'user_prof_010',
  'Camila Souza',
  '741.852.963-00',
  '1994-01-20',
  'camila.souza@email.com',
  '(21) 98876-5432',
  '22070-002',
  'Rua Barata Ribeiro',
  '370',
  'Apto 501',
  'Copacabana',
  'Rio de Janeiro',
  'RJ',
  -22.9679,
  -43.1848,
  '["Produção"]',
  '{"Produção": ["Vídeo", "Audiovisual"]}',
  '{}',
  true,
  '5',
  'Operadora de câmera para eventos e transmissões ao vivo.',
  '{"weekdays": true, "weekends": true, "holidays": true, "night": true, "travel": true}',
  '{"rg_front": "https://placehold.co/600x400/png?text=RG+Frente", "rg_back": "https://placehold.co/600x400/png?text=RG+Verso", "cpf": "https://placehold.co/600x400/png?text=CPF", "proof_of_address": "https://placehold.co/600x400/png?text=Comprovante"}',
  '["https://placehold.co/400x300/png?text=Video+1", "https://placehold.co/400x300/png?text=Video+2"]',
  'approved',
  NOW() - INTERVAL '28 days'
);

-- =====================================================
-- 3. FORNECEDORES COMPLETOS (com equipamentos, coords, preços)
-- =====================================================

INSERT INTO equipment_suppliers (
  clerk_id, company_name, contact_name, email, phone,
  address, city, state, zip_code, latitude, longitude,
  equipment_types, pricing, delivery_radius_km, shipping_fee_per_km,
  status
) VALUES

-- Fornecedor 1: Som e Luz Pro (Rio de Janeiro)
(
  'user_supp_001',
  'Som e Luz Pro',
  'Roberto Mendes',
  'contato@somluzpro.com',
  '(21) 3333-1111',
  'Rua da Assembleia, 100',
  'Rio de Janeiro',
  'RJ',
  '20011-000',
  -22.9035,
  -43.1758,
  ARRAY['Som', 'Iluminação', 'Palco'],
  '{"Som": {"Mesa de Som 32 Canais": 800, "Caixa Line Array": 1200, "Microfone Profissional": 150}, "Iluminação": {"Moving Head": 500, "Par LED": 80, "Controladora DMX": 300}, "Palco": {"Palco 8x6m": 2500, "Estrutura de Treliça": 1000}}',
  100,
  5.50,
  'active'
),

-- Fornecedor 2: Eventos Tech (São Paulo)
(
  'user_supp_002',
  'Eventos Tech',
  'Patrícia Alves',
  'vendas@eventostech.com',
  '(11) 4444-2222',
  'Avenida Paulista, 2000',
  'São Paulo',
  'SP',
  '01310-200',
  -23.5582,
  -46.6622,
  ARRAY['Audiovisual', 'Telão', 'Projeção'],
  '{"Audiovisual": {"Telão LED 6x4m": 4000, "Projetor 10000 Lumens": 1500, "Sistema de Videowall": 3500}, "Câmera": {"Câmera Broadcast": 2000, "Switcher de Vídeo": 1200}}',
  80,
  7.00,
  'active'
),

-- Fornecedor 3: Palco e Cia (Rio de Janeiro)
(
  'user_supp_003',
  'Palco e Cia',
  'Marcos Paulo',
  'locacao@palcoecia.com',
  '(21) 3555-3333',
  'Avenida Brasil, 5000',
  'Rio de Janeiro',
  'RJ',
  '21040-000',
  -22.8726,
  -43.2800,
  ARRAY['Palco', 'Estrutura', 'Cobertura'],
  '{"Palco": {"Palco 10x8m": 3500, "Palco 12x10m": 5000}, "Estrutura": {"Treliça Q30": 200, "Box Truss": 150}, "Cobertura": {"Tenda 10x10m": 1800, "Tenda 15x15m": 3000}}',
  120,
  4.50,
  'active'
),

-- Fornecedor 4: Audiovisual RJ (Rio de Janeiro)
(
  'user_supp_004',
  'Audiovisual RJ',
  'Sandra Lima',
  'contato@audiovisual.com',
  '(21) 2666-4444',
  'Rua São José, 90',
  'Rio de Janeiro',
  'RJ',
  '20010-020',
  -22.9094,
  -43.1802,
  ARRAY['Som', 'Iluminação', 'Audiovisual'],
  '{"Som": {"Sistema de PA Completo": 3000, "Subwoofer": 600}, "Iluminação": {"Kit LED Básico": 1200, "Follow Spot": 800}, "Audiovisual": {"Tela de Projeção 4x3m": 400, "Sistema de Streaming": 1500}}',
  90,
  6.00,
  'active'
),

-- Fornecedor 5: Mega Som Eventos (São Paulo)
(
  'user_supp_005',
  'Mega Som Eventos',
  'Rodrigo Santos',
  'eventos@megasom.com',
  '(11) 3777-5555',
  'Rua da Consolação, 1500',
  'São Paulo',
  'SP',
  '01301-100',
  -23.5498,
  -46.6598,
  ARRAY['Som', 'Iluminação', 'Gerador'],
  '{"Som": {"Sistema de Som Completo": 5000, "Retorno de Palco": 400}, "Iluminação": {"Projeto de Iluminação Completo": 4500}, "Gerador": {"Gerador 100kVA": 2000, "Gerador 200kVA": 3500}}',
  150,
  5.00,
  'active'
);

-- =====================================================
-- 4. PROJETOS DE EVENTOS (3 projetos completos)
-- =====================================================

-- Projeto 1: Festival de Música (Rio de Janeiro)
INSERT INTO event_projects (
  project_number, client_name, client_email, client_phone,
  event_name, event_type, event_description,
  event_date, start_time, end_time, expected_attendance,
  venue_name, venue_address, venue_city, venue_state,
  latitude, longitude,
  is_urgent, profit_margin, status,
  professionals_needed, equipment_needed
) VALUES (
  'PRJ-20250110-0001',
  'Produtora Cultural ABC',
  'contato@produtorabc.com',
  '(21) 99999-1111',
  'Festival Rock na Praia 2025',
  'Show',
  'Festival de música com 3 bandas de rock, público estimado de 2000 pessoas na orla de Copacabana.',
  '2025-02-15',
  '18:00:00',
  '23:00:00',
  2000,
  'Orla de Copacabana',
  'Avenida Atlântica, s/n',
  'Rio de Janeiro',
  'RJ',
  -22.9711,
  -43.1822,
  false,
  35.00,
  'analyzing',
  '[
    {"category": "Técnica", "subcategory": "Elétrica", "quantity": 2, "notes": "Profissionais com NR10"},
    {"category": "Técnica", "subcategory": "Áudio", "quantity": 3, "notes": "Técnicos de som experientes"},
    {"category": "Técnica", "subcategory": "Iluminação", "quantity": 2, "notes": "Iluminadores"},
    {"category": "Segurança", "subcategory": "Eventos", "quantity": 8, "notes": "Segurança para controle de público"},
    {"category": "Produção", "subcategory": "Coordenação", "quantity": 1, "notes": "Coordenador geral"}
  ]',
  '[
    {"type": "Som", "name": "Sistema de PA Completo", "quantity": 1, "duration_days": 2},
    {"type": "Iluminação", "name": "Projeto de Iluminação Completo", "quantity": 1, "duration_days": 2},
    {"type": "Palco", "name": "Palco 12x10m", "quantity": 1, "duration_days": 2},
    {"type": "Gerador", "name": "Gerador 200kVA", "quantity": 2, "duration_days": 2}
  ]'
);

-- Projeto 2: Feira Corporativa (São Paulo)
INSERT INTO event_projects (
  project_number, client_name, client_email, client_phone,
  client_company, client_cnpj,
  event_name, event_type, event_description,
  event_date, start_time, end_time, expected_attendance,
  venue_name, venue_address, venue_city, venue_state,
  latitude, longitude,
  is_urgent, profit_margin, status,
  professionals_needed, equipment_needed
) VALUES (
  'PRJ-20250112-0002',
  'Maria Fernandes',
  'maria@techexpo.com.br',
  '(11) 98888-2222',
  'Tech Expo Brasil',
  '12.345.678/0001-90',
  'Feira de Tecnologia e Inovação 2025',
  'Feira',
  'Feira corporativa com 50 expositores, palestras e workshops sobre tecnologia.',
  '2025-03-20',
  '09:00:00',
  '18:00:00',
  5000,
  'Expo Center Norte',
  'Rua José Bernardo Pinto, 333',
  'São Paulo',
  'SP',
  -23.5162,
  -46.6172,
  true,
  80.00,
  'quoting',
  '[
    {"category": "Técnica", "subcategory": "Elétrica", "quantity": 4, "notes": "Instalação elétrica em 50 estandes"},
    {"category": "Técnica", "subcategory": "Audiovisual", "quantity": 2, "notes": "Operação de telões e projetores"},
    {"category": "Segurança", "subcategory": "Patrimonial", "quantity": 10, "notes": "Controle de acesso e segurança"},
    {"category": "Produção", "subcategory": "Fotografia", "quantity": 2, "notes": "Cobertura fotográfica do evento"},
    {"category": "Produção", "subcategory": "Coordenação", "quantity": 2, "notes": "Coordenação de produção"}
  ]',
  '[
    {"type": "Audiovisual", "name": "Telão LED 6x4m", "quantity": 3, "duration_days": 3},
    {"type": "Som", "name": "Sistema de Som para Palestras", "quantity": 2, "duration_days": 3},
    {"type": "Iluminação", "name": "Iluminação de Estandes", "quantity": 1, "duration_days": 3},
    {"type": "Estrutura", "name": "Backdrop 8x3m", "quantity": 5, "duration_days": 3}
  ]'
);

-- Projeto 3: Casamento (Rio de Janeiro)
INSERT INTO event_projects (
  project_number, client_name, client_email, client_phone,
  event_name, event_type, event_description,
  event_date, start_time, end_time, expected_attendance,
  venue_name, venue_address, venue_city, venue_state,
  latitude, longitude,
  is_urgent, profit_margin, status,
  professionals_needed, equipment_needed
) VALUES (
  'PRJ-20250115-0003',
  'Ana Paula Costa',
  'ana.costa.events@email.com',
  '(21) 97777-3333',
  'Casamento Ana & Carlos',
  'Casamento',
  'Casamento elegante com cerimônia e festa, público de 200 convidados.',
  '2025-04-05',
  '17:00:00',
  '02:00:00',
  200,
  'Jardim Botânico',
  'Rua Jardim Botânico, 1008',
  'Rio de Janeiro',
  'RJ',
  -22.9660,
  -43.2250,
  false,
  35.00,
  'new',
  '[
    {"category": "Produção", "subcategory": "Fotografia", "quantity": 1, "notes": "Fotógrafo profissional"},
    {"category": "Produção", "subcategory": "Vídeo", "quantity": 1, "notes": "Cinegrafista"},
    {"category": "Técnica", "subcategory": "Áudio", "quantity": 1, "notes": "Técnico de som para cerimônia e festa"},
    {"category": "Técnica", "subcategory": "Iluminação", "quantity": 1, "notes": "Iluminação decorativa"}
  ]',
  '[
    {"type": "Som", "name": "Sistema de Som para Festa", "quantity": 1, "duration_days": 1},
    {"type": "Iluminação", "name": "Iluminação Decorativa", "quantity": 1, "duration_days": 1},
    {"type": "Estrutura", "name": "Tenda 15x15m", "quantity": 1, "duration_days": 1}
  ]'
);

-- =====================================================
-- 5. EQUIPES DOS PROJETOS (project_team)
-- =====================================================

-- Equipe Projeto 1: Festival Rock na Praia
INSERT INTO project_team (
  project_id, professional_id, role, category, subcategory,
  quantity, duration_days, daily_rate, status
) VALUES
-- Eletricistas
(
  (SELECT id FROM event_projects WHERE project_number = 'PRJ-20250110-0001'),
  (SELECT id FROM professionals WHERE cpf = '123.456.789-00'), -- João Silva
  'Eletricista Sênior',
  'Técnica',
  'Elétrica',
  1, 2, 450.00, 'planned'
),
-- Técnicos de som
(
  (SELECT id FROM event_projects WHERE project_number = 'PRJ-20250110-0001'),
  (SELECT id FROM professionals WHERE cpf = '147.258.369-00'), -- Lucas Almeida
  'Técnico de Som',
  'Técnica',
  'Áudio',
  1, 2, 500.00, 'invited'
),
-- Iluminadores
(
  (SELECT id FROM event_projects WHERE project_number = 'PRJ-20250110-0001'),
  (SELECT id FROM professionals WHERE cpf = '369.147.258-00'), -- Rafael Martins
  'Iluminador',
  'Técnica',
  'Iluminação',
  1, 2, 480.00, 'confirmed'
),
-- Segurança
(
  (SELECT id FROM event_projects WHERE project_number = 'PRJ-20250110-0001'),
  (SELECT id FROM professionals WHERE cpf = '321.654.987-00'), -- Ana Costa
  'Segurança',
  'Segurança',
  'Eventos',
  3, 2, 250.00, 'confirmed'
),
-- Coordenadora
(
  (SELECT id FROM event_projects WHERE project_number = 'PRJ-20250110-0001'),
  (SELECT id FROM professionals WHERE cpf = '654.321.789-00'), -- Julia Rodrigues
  'Coordenadora de Produção',
  'Produção',
  'Coordenação',
  1, 3, 800.00, 'confirmed'
);

-- Equipe Projeto 2: Feira de Tecnologia (urgente - margem 80%)
INSERT INTO project_team (
  project_id, professional_id, role, category, subcategory,
  quantity, duration_days, daily_rate, status
) VALUES
-- Eletricistas
(
  (SELECT id FROM event_projects WHERE project_number = 'PRJ-20250112-0002'),
  (SELECT id FROM professionals WHERE cpf = '123.456.789-00'), -- João Silva
  'Eletricista',
  'Técnica',
  'Elétrica',
  2, 3, 450.00, 'planned'
),
-- Fotógrafos
(
  (SELECT id FROM event_projects WHERE project_number = 'PRJ-20250112-0002'),
  (SELECT id FROM professionals WHERE cpf = '789.123.456-00'), -- Pedro Ferreira
  'Fotógrafo',
  'Produção',
  'Fotografia',
  1, 3, 600.00, 'planned'
),
-- Segurança
(
  (SELECT id FROM event_projects WHERE project_number = 'PRJ-20250112-0002'),
  (SELECT id FROM professionals WHERE cpf = '321.654.987-00'), -- Ana Costa
  'Segurança',
  'Segurança',
  'Patrimonial',
  5, 3, 250.00, 'planned'
);

-- Equipe Projeto 3: Casamento
INSERT INTO project_team (
  project_id, professional_id, role, category, subcategory,
  quantity, duration_days, daily_rate, status
) VALUES
-- Fotógrafo
(
  (SELECT id FROM event_projects WHERE project_number = 'PRJ-20250115-0003'),
  (SELECT id FROM professionals WHERE cpf = '789.123.456-00'), -- Pedro Ferreira
  'Fotógrafo',
  'Produção',
  'Fotografia',
  1, 1, 1200.00, 'planned'
),
-- Cinegrafista
(
  (SELECT id FROM event_projects WHERE project_number = 'PRJ-20250115-0003'),
  (SELECT id FROM professionals WHERE cpf = '741.852.963-00'), -- Camila Souza
  'Cinegrafista',
  'Produção',
  'Vídeo',
  1, 1, 1000.00, 'planned'
),
-- Técnico de som
(
  (SELECT id FROM event_projects WHERE project_number = 'PRJ-20250115-0003'),
  (SELECT id FROM professionals WHERE cpf = '147.258.369-00'), -- Lucas Almeida
  'Técnico de Som',
  'Técnica',
  'Áudio',
  1, 1, 500.00, 'planned'
);

-- =====================================================
-- 6. EQUIPAMENTOS DOS PROJETOS (project_equipment)
-- =====================================================

-- Equipamentos Projeto 1: Festival Rock na Praia
INSERT INTO project_equipment (
  project_id, selected_supplier_id,
  equipment_type, category, name, description,
  quantity, duration_days, daily_rate, status
) VALUES
(
  (SELECT id FROM event_projects WHERE project_number = 'PRJ-20250110-0001'),
  (SELECT id FROM equipment_suppliers WHERE company_name = 'Mega Som Eventos'),
  'Som',
  'Áudio',
  'Sistema de PA Completo',
  'Sistema de som profissional para 2000 pessoas',
  1, 2, 5000.00, 'confirmed'
),
(
  (SELECT id FROM event_projects WHERE project_number = 'PRJ-20250110-0001'),
  (SELECT id FROM equipment_suppliers WHERE company_name = 'Mega Som Eventos'),
  'Iluminação',
  'Luz',
  'Projeto de Iluminação Completo',
  'Iluminação profissional para show',
  1, 2, 4500.00, 'confirmed'
),
(
  (SELECT id FROM event_projects WHERE project_number = 'PRJ-20250110-0001'),
  (SELECT id FROM equipment_suppliers WHERE company_name = 'Palco e Cia'),
  'Palco',
  'Estrutura',
  'Palco 12x10m',
  'Palco profissional com cobertura',
  1, 2, 5000.00, 'confirmed'
);

-- Equipamentos Projeto 2: Feira de Tecnologia
INSERT INTO project_equipment (
  project_id, selected_supplier_id,
  equipment_type, category, name,
  quantity, duration_days, daily_rate, status
) VALUES
(
  (SELECT id FROM event_projects WHERE project_number = 'PRJ-20250112-0002'),
  (SELECT id FROM equipment_suppliers WHERE company_name = 'Eventos Tech'),
  'Audiovisual',
  'Vídeo',
  'Telão LED 6x4m',
  3, 3, 4000.00, 'quoting'
),
(
  (SELECT id FROM event_projects WHERE project_number = 'PRJ-20250112-0002'),
  (SELECT id FROM equipment_suppliers WHERE company_name = 'Eventos Tech'),
  'Audiovisual',
  'Vídeo',
  'Projetor 10000 Lumens',
  2, 3, 1500.00, 'quoting'
);

-- Equipamentos Projeto 3: Casamento
INSERT INTO project_equipment (
  project_id,
  equipment_type, category, name,
  quantity, duration_days, status
) VALUES
(
  (SELECT id FROM event_projects WHERE project_number = 'PRJ-20250115-0003'),
  'Som',
  'Áudio',
  'Sistema de Som para Festa',
  1, 1, 'requested'
),
(
  (SELECT id FROM event_projects WHERE project_number = 'PRJ-20250115-0003'),
  'Iluminação',
  'Luz',
  'Iluminação Decorativa',
  1, 1, 'requested'
);

-- =====================================================
-- 7. CATEGORIAS E TIPOS DE EVENTOS
-- =====================================================

INSERT INTO categories (name, description) VALUES
('Técnica', 'Profissionais técnicos especializados'),
('Produção', 'Profissionais de produção e coordenação'),
('Segurança', 'Profissionais de segurança'),
('Transporte', 'Motoristas e transportadores')
ON CONFLICT (name) DO NOTHING;

INSERT INTO event_types (name, description) VALUES
('Show', 'Shows e apresentações musicais'),
('Feira', 'Feiras e exposições'),
('Casamento', 'Casamentos e festas de casamento'),
('Corporativo', 'Eventos corporativos'),
('Festival', 'Festivais de música e cultura'),
('Congresso', 'Congressos e convenções'),
('Formatura', 'Formaturas e eventos acadêmicos')
ON CONFLICT (name) DO NOTHING;

COMMIT;

-- =====================================================
-- RESUMO DO SEED
-- =====================================================
-- ✅ 10 Profissionais aprovados (Rio de Janeiro e São Paulo)
-- ✅ 5 Fornecedores ativos com equipamentos e preços
-- ✅ 3 Projetos de eventos completos
-- ✅ Equipes alocadas nos projetos
-- ✅ Equipamentos solicitados e confirmados
-- ✅ Coordenadas GPS para geolocalização
-- ✅ Documentos, portfólios e certificações
-- =====================================================

SELECT
  'SEED COMPLETO!' as status,
  (SELECT COUNT(*) FROM professionals WHERE status = 'approved') as profissionais_aprovados,
  (SELECT COUNT(*) FROM equipment_suppliers WHERE status = 'active') as fornecedores_ativos,
  (SELECT COUNT(*) FROM event_projects) as projetos_criados,
  (SELECT COUNT(*) FROM project_team) as membros_equipe,
  (SELECT COUNT(*) FROM project_equipment) as equipamentos_alocados;
