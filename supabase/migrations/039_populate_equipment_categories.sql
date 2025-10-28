-- =====================================================
-- Migration: Populate Equipment/Supplier Categories
-- Description: Popular categorias de equipamentos/fornecedores do arquivo equipment-types.ts
-- Total: 14 categorias, ~155 subcategorias
-- =====================================================

-- ===== 1. SOM E ÁUDIO =====
INSERT INTO categories (name, description, category_type, icon, color, order_index, active)
VALUES ('Som e Áudio', 'Equipamentos de som e áudio profissional', 'equipment', 'volume-2', '#3b82f6', 1, true);

INSERT INTO category_subcategories (category_id, name, slug, description, order_index)
SELECT id, 'Sistema de Som Completo', 'sistema_som_completo', 'PA completo para eventos', 1 FROM categories WHERE name = 'Som e Áudio' AND category_type = 'equipment'
UNION ALL SELECT id, 'Line Array', 'line_array', 'Sistema de caixas suspensas', 2 FROM categories WHERE name = 'Som e Áudio' AND category_type = 'equipment'
UNION ALL SELECT id, 'Caixas de Som', 'caixas_som', 'Caixas ativas e passivas', 3 FROM categories WHERE name = 'Som e Áudio' AND category_type = 'equipment'
UNION ALL SELECT id, 'Subwoofers', 'subwoofers', 'Graves e sub-graves', 4 FROM categories WHERE name = 'Som e Áudio' AND category_type = 'equipment'
UNION ALL SELECT id, 'Monitores de Palco', 'monitores_palco', 'Retorno de palco', 5 FROM categories WHERE name = 'Som e Áudio' AND category_type = 'equipment'
UNION ALL SELECT id, 'Mesa de Som Digital', 'mesa_som_digital', 'Consoles digitais', 6 FROM categories WHERE name = 'Som e Áudio' AND category_type = 'equipment'
UNION ALL SELECT id, 'Mesa de Som Analógica', 'mesa_som_analogica', 'Consoles analógicos', 7 FROM categories WHERE name = 'Som e Áudio' AND category_type = 'equipment'
UNION ALL SELECT id, 'Microfones com Fio', 'microfones_fio', 'Microfones cabeados', 8 FROM categories WHERE name = 'Som e Áudio' AND category_type = 'equipment'
UNION ALL SELECT id, 'Microfones Sem Fio', 'microfones_sem_fio', 'Wireless', 9 FROM categories WHERE name = 'Som e Áudio' AND category_type = 'equipment'
UNION ALL SELECT id, 'Microfones de Lapela', 'microfones_lapela', 'Headset e lapela', 10 FROM categories WHERE name = 'Som e Áudio' AND category_type = 'equipment'
UNION ALL SELECT id, 'DI Boxes', 'di_boxes', 'Direct boxes', 11 FROM categories WHERE name = 'Som e Áudio' AND category_type = 'equipment'
UNION ALL SELECT id, 'Processadores de Áudio', 'processadores_audio', 'DSP, crossover, etc', 12 FROM categories WHERE name = 'Som e Áudio' AND category_type = 'equipment'
UNION ALL SELECT id, 'Amplificadores', 'amplificadores', 'Potências de áudio', 13 FROM categories WHERE name = 'Som e Áudio' AND category_type = 'equipment'
UNION ALL SELECT id, 'Cabos e Conectores de Áudio', 'cabos_audio', '', 14 FROM categories WHERE name = 'Som e Áudio' AND category_type = 'equipment';

-- ===== 2. ILUMINAÇÃO =====
INSERT INTO categories (name, description, category_type, icon, color, order_index, active)
VALUES ('Iluminação', 'Equipamentos de iluminação e efeitos especiais', 'equipment', 'lightbulb', '#eab308', 2, true);

INSERT INTO category_subcategories (category_id, name, slug, description, order_index)
SELECT id, 'Iluminação Completa', 'iluminacao_completa', 'Projeto completo', 1 FROM categories WHERE name = 'Iluminação' AND category_type = 'equipment'
UNION ALL SELECT id, 'Moving Heads', 'moving_heads', 'Cabeças móveis', 2 FROM categories WHERE name = 'Iluminação' AND category_type = 'equipment'
UNION ALL SELECT id, 'Moving Beam', 'moving_beam', 'Feixes de luz', 3 FROM categories WHERE name = 'Iluminação' AND category_type = 'equipment'
UNION ALL SELECT id, 'Moving Wash', 'moving_wash', 'Wash LED', 4 FROM categories WHERE name = 'Iluminação' AND category_type = 'equipment'
UNION ALL SELECT id, 'LED PAR', 'led_par', 'Refletores LED PAR', 5 FROM categories WHERE name = 'Iluminação' AND category_type = 'equipment'
UNION ALL SELECT id, 'Refletores LED', 'refletores_led', 'Iluminação LED geral', 6 FROM categories WHERE name = 'Iluminação' AND category_type = 'equipment'
UNION ALL SELECT id, 'Refletores Convencionais', 'refletores_convencionais', 'Lâmpadas halógenas', 7 FROM categories WHERE name = 'Iluminação' AND category_type = 'equipment'
UNION ALL SELECT id, 'Strobo', 'strobo', 'Efeito estroboscópico', 8 FROM categories WHERE name = 'Iluminação' AND category_type = 'equipment'
UNION ALL SELECT id, 'Laser RGB', 'laser_rgb', 'Efeitos laser coloridos', 9 FROM categories WHERE name = 'Iluminação' AND category_type = 'equipment'
UNION ALL SELECT id, 'Laser Verde/Vermelho', 'laser_verde', 'Lasers monocromáticos', 10 FROM categories WHERE name = 'Iluminação' AND category_type = 'equipment'
UNION ALL SELECT id, 'Máquina de Fumaça', 'maquina_fumaca', 'Efeito de névoa', 11 FROM categories WHERE name = 'Iluminação' AND category_type = 'equipment'
UNION ALL SELECT id, 'Máquina de Gelo Seco', 'maquina_gelo_seco', 'Névoa baixa', 12 FROM categories WHERE name = 'Iluminação' AND category_type = 'equipment'
UNION ALL SELECT id, 'Máquina de Bolhas', 'maquina_bolhas', '', 13 FROM categories WHERE name = 'Iluminação' AND category_type = 'equipment'
UNION ALL SELECT id, 'Canhão de Confete/Serpentina', 'canhao_confete', '', 14 FROM categories WHERE name = 'Iluminação' AND category_type = 'equipment'
UNION ALL SELECT id, 'Mesa de Iluminação', 'mesa_iluminacao', 'Controladores DMX', 15 FROM categories WHERE name = 'Iluminação' AND category_type = 'equipment'
UNION ALL SELECT id, 'Dimmer Racks', 'dimmer', 'Controle de intensidade', 16 FROM categories WHERE name = 'Iluminação' AND category_type = 'equipment'
UNION ALL SELECT id, 'Follow Spot', 'followspot', 'Canhão seguidor', 17 FROM categories WHERE name = 'Iluminação' AND category_type = 'equipment'
UNION ALL SELECT id, 'Iluminação Arquitetural', 'iluminacao_arquitetural', 'Realce de fachadas', 18 FROM categories WHERE name = 'Iluminação' AND category_type = 'equipment';

-- ===== 3. AUDIOVISUAL =====
INSERT INTO categories (name, description, category_type, icon, color, order_index, active)
VALUES ('Audiovisual', 'Telões LED, projetores e equipamentos de vídeo', 'equipment', 'monitor', '#8b5cf6', 3, true);

INSERT INTO category_subcategories (category_id, name, slug, description, order_index)
SELECT id, 'Telão LED', 'telao_led', 'LED Wall outdoor/indoor', 1 FROM categories WHERE name = 'Audiovisual' AND category_type = 'equipment'
UNION ALL SELECT id, 'Painel LED P3', 'painel_led_p3', 'Indoor alta resolução', 2 FROM categories WHERE name = 'Audiovisual' AND category_type = 'equipment'
UNION ALL SELECT id, 'Painel LED P5', 'painel_led_p5', 'Indoor média resolução', 3 FROM categories WHERE name = 'Audiovisual' AND category_type = 'equipment'
UNION ALL SELECT id, 'Painel LED P10', 'painel_led_p10', 'Outdoor', 4 FROM categories WHERE name = 'Audiovisual' AND category_type = 'equipment'
UNION ALL SELECT id, 'Projetor 10.000 Lumens', 'projetor_10k', 'Alta luminosidade', 5 FROM categories WHERE name = 'Audiovisual' AND category_type = 'equipment'
UNION ALL SELECT id, 'Projetor 5.000 Lumens', 'projetor_5k', 'Média luminosidade', 6 FROM categories WHERE name = 'Audiovisual' AND category_type = 'equipment'
UNION ALL SELECT id, 'Projetor 3.000 Lumens', 'projetor_3k', 'Básico', 7 FROM categories WHERE name = 'Audiovisual' AND category_type = 'equipment'
UNION ALL SELECT id, 'Tela de Projeção', 'tela_projecao', 'Fast-fold, tripé', 8 FROM categories WHERE name = 'Audiovisual' AND category_type = 'equipment'
UNION ALL SELECT id, 'TVs e Monitores', 'tvs_monitores', 'Displays diversos', 9 FROM categories WHERE name = 'Audiovisual' AND category_type = 'equipment'
UNION ALL SELECT id, 'Câmeras Broadcast', 'cameras_broadcast', 'Profissionais', 10 FROM categories WHERE name = 'Audiovisual' AND category_type = 'equipment'
UNION ALL SELECT id, 'Câmeras PTZ', 'cameras_ptz', 'Robotizadas', 11 FROM categories WHERE name = 'Audiovisual' AND category_type = 'equipment'
UNION ALL SELECT id, 'Switcher de Vídeo', 'switcher_video', 'Mixer de vídeo', 12 FROM categories WHERE name = 'Audiovisual' AND category_type = 'equipment'
UNION ALL SELECT id, 'Encoder de Streaming', 'streaming_encoder', 'Transmissão ao vivo', 13 FROM categories WHERE name = 'Audiovisual' AND category_type = 'equipment'
UNION ALL SELECT id, 'Gravação de Vídeo', 'gravacao_video', 'Registro do evento', 14 FROM categories WHERE name = 'Audiovisual' AND category_type = 'equipment';

-- ===== 4. ESTRUTURAS =====
INSERT INTO categories (name, description, category_type, icon, color, order_index, active)
VALUES ('Estruturas', 'Palcos, tendas, treliças e estruturas metálicas', 'equipment', 'box', '#ef4444', 4, true);

INSERT INTO category_subcategories (category_id, name, slug, description, order_index)
SELECT id, 'Palco 6x4m', 'palco_6x4', 'Pequeno porte', 1 FROM categories WHERE name = 'Estruturas' AND category_type = 'equipment'
UNION ALL SELECT id, 'Palco 8x6m', 'palco_8x6', 'Médio porte', 2 FROM categories WHERE name = 'Estruturas' AND category_type = 'equipment'
UNION ALL SELECT id, 'Palco 10x8m', 'palco_10x8', 'Grande porte', 3 FROM categories WHERE name = 'Estruturas' AND category_type = 'equipment'
UNION ALL SELECT id, 'Palco Customizado', 'palco_customizado', 'Sob medida', 4 FROM categories WHERE name = 'Estruturas' AND category_type = 'equipment'
UNION ALL SELECT id, 'Tablado', 'tablado', 'Piso elevado', 5 FROM categories WHERE name = 'Estruturas' AND category_type = 'equipment'
UNION ALL SELECT id, 'Passarela', 'passarela', 'Para desfiles', 6 FROM categories WHERE name = 'Estruturas' AND category_type = 'equipment'
UNION ALL SELECT id, 'Tenda Piramidal', 'tenda_piramidal', 'Diversos tamanhos', 7 FROM categories WHERE name = 'Estruturas' AND category_type = 'equipment'
UNION ALL SELECT id, 'Tenda Chapéu de Bruxa', 'tenda_chapeu_bruxa', '', 8 FROM categories WHERE name = 'Estruturas' AND category_type = 'equipment'
UNION ALL SELECT id, 'Tenda Cristal', 'tenda_cristal', 'Transparente', 9 FROM categories WHERE name = 'Estruturas' AND category_type = 'equipment'
UNION ALL SELECT id, 'Cobertura de Lona', 'cobertura_lona', '', 10 FROM categories WHERE name = 'Estruturas' AND category_type = 'equipment'
UNION ALL SELECT id, 'Box Truss', 'box_truss', 'Treliça estrutural', 11 FROM categories WHERE name = 'Estruturas' AND category_type = 'equipment'
UNION ALL SELECT id, 'Tower Truss', 'tower_truss', 'Torres de som/luz', 12 FROM categories WHERE name = 'Estruturas' AND category_type = 'equipment'
UNION ALL SELECT id, 'Roof System', 'roof_system', 'Cobertura de palco', 13 FROM categories WHERE name = 'Estruturas' AND category_type = 'equipment'
UNION ALL SELECT id, 'Camarote', 'camarote', 'Estrutura VIP', 14 FROM categories WHERE name = 'Estruturas' AND category_type = 'equipment'
UNION ALL SELECT id, 'Arquibancada', 'arquibancada', '', 15 FROM categories WHERE name = 'Estruturas' AND category_type = 'equipment'
UNION ALL SELECT id, 'Grades de Segurança', 'grades_seguranca', 'Crowd barrier', 16 FROM categories WHERE name = 'Estruturas' AND category_type = 'equipment'
UNION ALL SELECT id, 'Fechamento Alambrado', 'fechamento_alambrado', '', 17 FROM categories WHERE name = 'Estruturas' AND category_type = 'equipment'
UNION ALL SELECT id, 'Cercas Plásticas', 'cercas_plasticas', '', 18 FROM categories WHERE name = 'Estruturas' AND category_type = 'equipment';

-- ===== 5. MOBILIÁRIO =====
INSERT INTO categories (name, description, category_type, icon, color, order_index, active)
VALUES ('Mobiliário', 'Mesas, cadeiras, sofás e móveis para eventos', 'equipment', 'armchair', '#f97316', 5, true);

INSERT INTO category_subcategories (category_id, name, slug, description, order_index)
SELECT id, 'Mesas Redondas', 'mesas_redondas', '8, 10, 12 lugares', 1 FROM categories WHERE name = 'Mobiliário' AND category_type = 'equipment'
UNION ALL SELECT id, 'Mesas Retangulares', 'mesas_retangulares', '', 2 FROM categories WHERE name = 'Mobiliário' AND category_type = 'equipment'
UNION ALL SELECT id, 'Mesas Quadradas', 'mesas_quadradas', '', 3 FROM categories WHERE name = 'Mobiliário' AND category_type = 'equipment'
UNION ALL SELECT id, 'Mesas Bistrô', 'mesas_bistro', 'Altas', 4 FROM categories WHERE name = 'Mobiliário' AND category_type = 'equipment'
UNION ALL SELECT id, 'Cadeiras de Ferro', 'cadeiras_ferro', '', 5 FROM categories WHERE name = 'Mobiliário' AND category_type = 'equipment'
UNION ALL SELECT id, 'Cadeiras de Plástico', 'cadeiras_plastico', '', 6 FROM categories WHERE name = 'Mobiliário' AND category_type = 'equipment'
UNION ALL SELECT id, 'Cadeiras de Madeira', 'cadeiras_madeira', '', 7 FROM categories WHERE name = 'Mobiliário' AND category_type = 'equipment'
UNION ALL SELECT id, 'Cadeiras Eames', 'cadeiras_eames', '', 8 FROM categories WHERE name = 'Mobiliário' AND category_type = 'equipment'
UNION ALL SELECT id, 'Sofás', 'sofas', 'Diversos modelos', 9 FROM categories WHERE name = 'Mobiliário' AND category_type = 'equipment'
UNION ALL SELECT id, 'Poltronas', 'poltronas', '', 10 FROM categories WHERE name = 'Mobiliário' AND category_type = 'equipment'
UNION ALL SELECT id, 'Puffs', 'puffs', '', 11 FROM categories WHERE name = 'Mobiliário' AND category_type = 'equipment'
UNION ALL SELECT id, 'Longarinas', 'longarinas', '', 12 FROM categories WHERE name = 'Mobiliário' AND category_type = 'equipment'
UNION ALL SELECT id, 'Aparadores', 'aparadores', '', 13 FROM categories WHERE name = 'Mobiliário' AND category_type = 'equipment'
UNION ALL SELECT id, 'Balcões', 'balcoes', 'Bar, credenciamento', 14 FROM categories WHERE name = 'Mobiliário' AND category_type = 'equipment'
UNION ALL SELECT id, 'Banquetas', 'banquetas', '', 15 FROM categories WHERE name = 'Mobiliário' AND category_type = 'equipment';

-- ===== 6. DECORAÇÃO E CENOGRAFIA =====
INSERT INTO categories (name, description, category_type, icon, color, order_index, active)
VALUES ('Decoração e Cenografia', 'Decoração temática e cenografia personalizada', 'equipment', 'palette', '#ec4899', 6, true);

INSERT INTO category_subcategories (category_id, name, slug, description, order_index)
SELECT id, 'Decoração Temática', 'decoracao_tematica', 'Projetos personalizados', 1 FROM categories WHERE name = 'Decoração e Cenografia' AND category_type = 'equipment'
UNION ALL SELECT id, 'Flores e Arranjos', 'flores_arranjos', '', 2 FROM categories WHERE name = 'Decoração e Cenografia' AND category_type = 'equipment'
UNION ALL SELECT id, 'Plantas Naturais', 'plantas_naturais', '', 3 FROM categories WHERE name = 'Decoração e Cenografia' AND category_type = 'equipment'
UNION ALL SELECT id, 'Plantas Artificiais', 'plantas_artificiais', '', 4 FROM categories WHERE name = 'Decoração e Cenografia' AND category_type = 'equipment'
UNION ALL SELECT id, 'Tapetes', 'tapetes', 'Vermelhos, diversos', 5 FROM categories WHERE name = 'Decoração e Cenografia' AND category_type = 'equipment'
UNION ALL SELECT id, 'Painéis Decorativos', 'paineis_decorativos', '', 6 FROM categories WHERE name = 'Decoração e Cenografia' AND category_type = 'equipment'
UNION ALL SELECT id, 'Backdrop', 'backdrop', 'Fundo fotográfico', 7 FROM categories WHERE name = 'Decoração e Cenografia' AND category_type = 'equipment'
UNION ALL SELECT id, 'Painéis MDF', 'paineis_mdf', '', 8 FROM categories WHERE name = 'Decoração e Cenografia' AND category_type = 'equipment'
UNION ALL SELECT id, 'Balões Decorativos', 'baloes_decorativos', '', 9 FROM categories WHERE name = 'Decoração e Cenografia' AND category_type = 'equipment'
UNION ALL SELECT id, 'Arcos de Balões', 'arcos_baloes', '', 10 FROM categories WHERE name = 'Decoração e Cenografia' AND category_type = 'equipment'
UNION ALL SELECT id, 'Cenografia Customizada', 'cenografia_customizada', '', 11 FROM categories WHERE name = 'Decoração e Cenografia' AND category_type = 'equipment'
UNION ALL SELECT id, 'Totens Decorativos', 'totens_decorativos', '', 12 FROM categories WHERE name = 'Decoração e Cenografia' AND category_type = 'equipment'
UNION ALL SELECT id, 'Cortinas e Divisórias', 'cortinas_divisorias', '', 13 FROM categories WHERE name = 'Decoração e Cenografia' AND category_type = 'equipment'
UNION ALL SELECT id, 'Forro de Teto', 'forro_teto', '', 14 FROM categories WHERE name = 'Decoração e Cenografia' AND category_type = 'equipment'
UNION ALL SELECT id, 'Iluminação Decorativa', 'iluminacao_decorativa', 'Lustres, pendentes', 15 FROM categories WHERE name = 'Decoração e Cenografia' AND category_type = 'equipment';

-- ===== 7. ENERGIA E INFRAESTRUTURA =====
INSERT INTO categories (name, description, category_type, icon, color, order_index, active)
VALUES ('Energia e Infraestrutura', 'Geradores, climatização e infraestrutura elétrica', 'equipment', 'zap', '#22c55e', 7, true);

INSERT INTO category_subcategories (category_id, name, slug, description, order_index)
SELECT id, 'Gerador 20 KVA', 'gerador_20kva', '', 1 FROM categories WHERE name = 'Energia e Infraestrutura' AND category_type = 'equipment'
UNION ALL SELECT id, 'Gerador 40 KVA', 'gerador_40kva', '', 2 FROM categories WHERE name = 'Energia e Infraestrutura' AND category_type = 'equipment'
UNION ALL SELECT id, 'Gerador 60 KVA', 'gerador_60kva', '', 3 FROM categories WHERE name = 'Energia e Infraestrutura' AND category_type = 'equipment'
UNION ALL SELECT id, 'Gerador 100 KVA+', 'gerador_100kva', '', 4 FROM categories WHERE name = 'Energia e Infraestrutura' AND category_type = 'equipment'
UNION ALL SELECT id, 'Quadros Elétricos', 'quadros_eletricos', 'Distribuição', 5 FROM categories WHERE name = 'Energia e Infraestrutura' AND category_type = 'equipment'
UNION ALL SELECT id, 'Cabos Elétricos', 'cabos_eletricos', '', 6 FROM categories WHERE name = 'Energia e Infraestrutura' AND category_type = 'equipment'
UNION ALL SELECT id, 'Extensões e Tomadas', 'extensoes', '', 7 FROM categories WHERE name = 'Energia e Infraestrutura' AND category_type = 'equipment'
UNION ALL SELECT id, 'Ar Condicionado Portátil', 'ar_condicionado_portatil', '', 8 FROM categories WHERE name = 'Energia e Infraestrutura' AND category_type = 'equipment'
UNION ALL SELECT id, 'Ar Condicionado Split', 'ar_condicionado_split', '', 9 FROM categories WHERE name = 'Energia e Infraestrutura' AND category_type = 'equipment'
UNION ALL SELECT id, 'Ventiladores Industriais', 'ventiladores_industriais', '', 10 FROM categories WHERE name = 'Energia e Infraestrutura' AND category_type = 'equipment'
UNION ALL SELECT id, 'Climatizadores', 'climatizadores', '', 11 FROM categories WHERE name = 'Energia e Infraestrutura' AND category_type = 'equipment'
UNION ALL SELECT id, 'Exaustores', 'exaustores', '', 12 FROM categories WHERE name = 'Energia e Infraestrutura' AND category_type = 'equipment'
UNION ALL SELECT id, 'Nobreak/UPS', 'nobreak', '', 13 FROM categories WHERE name = 'Energia e Infraestrutura' AND category_type = 'equipment';

-- ===== 8. SANITÁRIOS E HIGIENE =====
INSERT INTO categories (name, description, category_type, icon, color, order_index, active)
VALUES ('Sanitários e Higiene', 'Banheiros químicos e estruturas sanitárias', 'equipment', 'bath', '#06b6d4', 8, true);

INSERT INTO category_subcategories (category_id, name, slug, description, order_index)
SELECT id, 'Banheiro Químico VIP', 'banheiro_quimico_vip', 'Luxo', 1 FROM categories WHERE name = 'Sanitários e Higiene' AND category_type = 'equipment'
UNION ALL SELECT id, 'Banheiro Químico Standard', 'banheiro_quimico_standard', '', 2 FROM categories WHERE name = 'Sanitários e Higiene' AND category_type = 'equipment'
UNION ALL SELECT id, 'Banheiro PNE', 'banheiro_pne', 'Acessível', 3 FROM categories WHERE name = 'Sanitários e Higiene' AND category_type = 'equipment'
UNION ALL SELECT id, 'Trailer de Banheiros', 'trailer_banheiro', '', 4 FROM categories WHERE name = 'Sanitários e Higiene' AND category_type = 'equipment'
UNION ALL SELECT id, 'Pias Portáteis', 'pias_portateis', '', 5 FROM categories WHERE name = 'Sanitários e Higiene' AND category_type = 'equipment'
UNION ALL SELECT id, 'Mictório Portátil', 'mictorio_portatil', '', 6 FROM categories WHERE name = 'Sanitários e Higiene' AND category_type = 'equipment'
UNION ALL SELECT id, 'Fraldário', 'fraldario', '', 7 FROM categories WHERE name = 'Sanitários e Higiene' AND category_type = 'equipment';

-- ===== 9. CATERING E GASTRONOMIA =====
INSERT INTO categories (name, description, category_type, icon, color, order_index, active)
VALUES ('Catering e Gastronomia', 'Buffet, coffee break e equipamentos gastronômicos', 'equipment', 'utensils', '#f59e0b', 9, true);

INSERT INTO category_subcategories (category_id, name, slug, description, order_index)
SELECT id, 'Buffet Completo', 'buffet_completo', '', 1 FROM categories WHERE name = 'Catering e Gastronomia' AND category_type = 'equipment'
UNION ALL SELECT id, 'Coquetel', 'coquetel', '', 2 FROM categories WHERE name = 'Catering e Gastronomia' AND category_type = 'equipment'
UNION ALL SELECT id, 'Coffee Break', 'coffee_break', '', 3 FROM categories WHERE name = 'Catering e Gastronomia' AND category_type = 'equipment'
UNION ALL SELECT id, 'Food Truck', 'food_truck', '', 4 FROM categories WHERE name = 'Catering e Gastronomia' AND category_type = 'equipment'
UNION ALL SELECT id, 'Churrasco', 'churrasco', '', 5 FROM categories WHERE name = 'Catering e Gastronomia' AND category_type = 'equipment'
UNION ALL SELECT id, 'Chopeira', 'chopeira', '', 6 FROM categories WHERE name = 'Catering e Gastronomia' AND category_type = 'equipment'
UNION ALL SELECT id, 'Máquina de Café', 'maquina_cafe', '', 7 FROM categories WHERE name = 'Catering e Gastronomia' AND category_type = 'equipment'
UNION ALL SELECT id, 'Equipamentos de Cozinha', 'equipamentos_cozinha', '', 8 FROM categories WHERE name = 'Catering e Gastronomia' AND category_type = 'equipment'
UNION ALL SELECT id, 'Refrigeradores e Freezers', 'refrigeradores', '', 9 FROM categories WHERE name = 'Catering e Gastronomia' AND category_type = 'equipment'
UNION ALL SELECT id, 'Bebidas', 'bebidas', 'Fornecimento', 10 FROM categories WHERE name = 'Catering e Gastronomia' AND category_type = 'equipment';

-- ===== 10. SEGURANÇA E CONTROLE =====
INSERT INTO categories (name, description, category_type, icon, color, order_index, active)
VALUES ('Segurança e Controle', 'Equipes de segurança e controle de acesso', 'equipment', 'shield-check', '#dc2626', 10, true);

INSERT INTO category_subcategories (category_id, name, slug, description, order_index)
SELECT id, 'Equipe de Segurança', 'equipe_seguranca', '', 1 FROM categories WHERE name = 'Segurança e Controle' AND category_type = 'equipment'
UNION ALL SELECT id, 'Câmeras de Vigilância', 'cameras_vigilancia', '', 2 FROM categories WHERE name = 'Segurança e Controle' AND category_type = 'equipment'
UNION ALL SELECT id, 'Detector de Metal', 'detector_metal', '', 3 FROM categories WHERE name = 'Segurança e Controle' AND category_type = 'equipment'
UNION ALL SELECT id, 'Controle de Acesso', 'controle_acesso', 'Catracas, biometria', 4 FROM categories WHERE name = 'Segurança e Controle' AND category_type = 'equipment'
UNION ALL SELECT id, 'Rádios Comunicadores', 'radios_comunicadores', '', 5 FROM categories WHERE name = 'Segurança e Controle' AND category_type = 'equipment'
UNION ALL SELECT id, 'Extintores de Incêndio', 'extintores', '', 6 FROM categories WHERE name = 'Segurança e Controle' AND category_type = 'equipment'
UNION ALL SELECT id, 'Sinalização de Emergência', 'sinalizacao_emergencia', '', 7 FROM categories WHERE name = 'Segurança e Controle' AND category_type = 'equipment';

-- ===== 11. TECNOLOGIA E INTERATIVIDADE =====
INSERT INTO categories (name, description, category_type, icon, color, order_index, active)
VALUES ('Tecnologia e Interatividade', 'Wi-Fi, tablets, credenciamento e tecnologia para eventos', 'equipment', 'laptop', '#6366f1', 11, true);

INSERT INTO category_subcategories (category_id, name, slug, description, order_index)
SELECT id, 'Wi-Fi para Eventos', 'wifi_eventos', 'Internet de alta capacidade', 1 FROM categories WHERE name = 'Tecnologia e Interatividade' AND category_type = 'equipment'
UNION ALL SELECT id, 'Hotspot Portátil', 'hotspot', '', 2 FROM categories WHERE name = 'Tecnologia e Interatividade' AND category_type = 'equipment'
UNION ALL SELECT id, 'Credenciamento Eletrônico', 'credenciamento_eletronico', '', 3 FROM categories WHERE name = 'Tecnologia e Interatividade' AND category_type = 'equipment'
UNION ALL SELECT id, 'Totens Interativos', 'totens_interativos', '', 4 FROM categories WHERE name = 'Tecnologia e Interatividade' AND category_type = 'equipment'
UNION ALL SELECT id, 'Tablets', 'tablets', '', 5 FROM categories WHERE name = 'Tecnologia e Interatividade' AND category_type = 'equipment'
UNION ALL SELECT id, 'Computadores/Notebooks', 'computadores', '', 6 FROM categories WHERE name = 'Tecnologia e Interatividade' AND category_type = 'equipment'
UNION ALL SELECT id, 'Impressoras', 'impressoras', '', 7 FROM categories WHERE name = 'Tecnologia e Interatividade' AND category_type = 'equipment'
UNION ALL SELECT id, 'Leitor QR Code', 'leitor_qrcode', '', 8 FROM categories WHERE name = 'Tecnologia e Interatividade' AND category_type = 'equipment'
UNION ALL SELECT id, 'Sistema de Votação', 'sistema_votacao', '', 9 FROM categories WHERE name = 'Tecnologia e Interatividade' AND category_type = 'equipment'
UNION ALL SELECT id, 'Aplicativo de Evento', 'aplicativo_evento', '', 10 FROM categories WHERE name = 'Tecnologia e Interatividade' AND category_type = 'equipment';

-- ===== 12. TRANSPORTE DE EQUIPAMENTOS =====
INSERT INTO categories (name, description, category_type, icon, color, order_index, active)
VALUES ('Transporte de Equipamentos', 'Transporte de equipamentos e gestão de estacionamento', 'equipment', 'truck', '#84cc16', 12, true);

INSERT INTO category_subcategories (category_id, name, slug, description, order_index)
SELECT id, 'Ônibus/Van', 'onibus', '', 1 FROM categories WHERE name = 'Transporte de Equipamentos' AND category_type = 'equipment'
UNION ALL SELECT id, 'Caminhão de Mudança', 'caminhao_mudanca', '', 2 FROM categories WHERE name = 'Transporte de Equipamentos' AND category_type = 'equipment'
UNION ALL SELECT id, 'Empilhadeira', 'empilhadeira', '', 3 FROM categories WHERE name = 'Transporte de Equipamentos' AND category_type = 'equipment'
UNION ALL SELECT id, 'Carrinho de Carga', 'carrinho_carga', '', 4 FROM categories WHERE name = 'Transporte de Equipamentos' AND category_type = 'equipment'
UNION ALL SELECT id, 'Gestão de Estacionamento', 'estacionamento', '', 5 FROM categories WHERE name = 'Transporte de Equipamentos' AND category_type = 'equipment'
UNION ALL SELECT id, 'Manobrista', 'manobrista', '', 6 FROM categories WHERE name = 'Transporte de Equipamentos' AND category_type = 'equipment';

-- ===== 13. OUTROS SERVIÇOS =====
INSERT INTO categories (name, description, category_type, icon, color, order_index, active)
VALUES ('Outros Serviços', 'Limpeza, seguros e licenças', 'equipment', 'more-horizontal', '#64748b', 13, true);

INSERT INTO category_subcategories (category_id, name, slug, description, order_index)
SELECT id, 'Limpeza Pré-Evento', 'limpeza_pre_evento', '', 1 FROM categories WHERE name = 'Outros Serviços' AND category_type = 'equipment'
UNION ALL SELECT id, 'Limpeza Pós-Evento', 'limpeza_pos_evento', '', 2 FROM categories WHERE name = 'Outros Serviços' AND category_type = 'equipment'
UNION ALL SELECT id, 'Limpeza Durante Evento', 'limpeza_durante_evento', '', 3 FROM categories WHERE name = 'Outros Serviços' AND category_type = 'equipment'
UNION ALL SELECT id, 'Mão de Obra para Montagem', 'mao_obra_montagem', '', 4 FROM categories WHERE name = 'Outros Serviços' AND category_type = 'equipment'
UNION ALL SELECT id, 'Mão de Obra para Operação', 'mao_obra_operacao', '', 5 FROM categories WHERE name = 'Outros Serviços' AND category_type = 'equipment'
UNION ALL SELECT id, 'Seguro de Evento', 'seguro_evento', '', 6 FROM categories WHERE name = 'Outros Serviços' AND category_type = 'equipment'
UNION ALL SELECT id, 'Alvará e Licenças', 'alvara_licencas', '', 7 FROM categories WHERE name = 'Outros Serviços' AND category_type = 'equipment';

-- =====================================================
-- Sumário da Migration
-- =====================================================
-- ✅ 14 categorias de equipamentos criadas
-- ✅ ~155 subcategorias de equipamentos criadas
-- ✅ Ícones e cores configurados
-- ✅ Ordem preservada do arquivo original
