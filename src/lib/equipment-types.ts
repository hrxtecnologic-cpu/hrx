/**
 * Tipos de Equipamentos para Fornecedores
 * Sistema completo organizado por categorias
 */

export interface EquipmentSubtype {
  name: string;
  label: string;
  description?: string;
}

export interface EquipmentCategory {
  name: string;
  label: string;
  subtypes: EquipmentSubtype[];
}

export const EQUIPMENT_CATEGORIES: EquipmentCategory[] = [
  // ===== SOM E ÁUDIO =====
  {
    name: 'som_audio',
    label: 'Som e Áudio',
    subtypes: [
      { name: 'sistema_som_completo', label: 'Sistema de Som Completo', description: 'PA completo para eventos' },
      { name: 'line_array', label: 'Line Array', description: 'Sistema de caixas suspensas' },
      { name: 'caixas_som', label: 'Caixas de Som', description: 'Caixas ativas e passivas' },
      { name: 'subwoofers', label: 'Subwoofers', description: 'Graves e sub-graves' },
      { name: 'monitores_palco', label: 'Monitores de Palco', description: 'Retorno de palco' },
      { name: 'mesa_som_digital', label: 'Mesa de Som Digital', description: 'Consoles digitais' },
      { name: 'mesa_som_analogica', label: 'Mesa de Som Analógica', description: 'Consoles analógicos' },
      { name: 'microfones_fio', label: 'Microfones com Fio', description: 'Microfones cabeados' },
      { name: 'microfones_sem_fio', label: 'Microfones Sem Fio', description: 'Wireless' },
      { name: 'microfones_lapela', label: 'Microfones de Lapela', description: 'Headset e lapela' },
      { name: 'di_boxes', label: 'DI Boxes', description: 'Direct boxes' },
      { name: 'processadores_audio', label: 'Processadores de Áudio', description: 'DSP, crossover, etc' },
      { name: 'amplificadores', label: 'Amplificadores', description: 'Potências de áudio' },
      { name: 'cabos_audio', label: 'Cabos e Conectores de Áudio' },
    ],
  },

  // ===== ILUMINAÇÃO =====
  {
    name: 'iluminacao',
    label: 'Iluminação',
    subtypes: [
      { name: 'iluminacao_completa', label: 'Iluminação Completa', description: 'Projeto completo' },
      { name: 'moving_heads', label: 'Moving Heads', description: 'Cabeças móveis' },
      { name: 'moving_beam', label: 'Moving Beam', description: 'Feixes de luz' },
      { name: 'moving_wash', label: 'Moving Wash', description: 'Wash LED' },
      { name: 'led_par', label: 'LED PAR', description: 'Refletores LED PAR' },
      { name: 'refletores_led', label: 'Refletores LED', description: 'Iluminação LED geral' },
      { name: 'refletores_convencionais', label: 'Refletores Convencionais', description: 'Lâmpadas halógenas' },
      { name: 'strobo', label: 'Strobo', description: 'Efeito estroboscópico' },
      { name: 'laser_rgb', label: 'Laser RGB', description: 'Efeitos laser coloridos' },
      { name: 'laser_verde', label: 'Laser Verde/Vermelho', description: 'Lasers monocromáticos' },
      { name: 'maquina_fumaca', label: 'Máquina de Fumaça', description: 'Efeito de névoa' },
      { name: 'maquina_gelo_seco', label: 'Máquina de Gelo Seco', description: 'Névoa baixa' },
      { name: 'maquina_bolhas', label: 'Máquina de Bolhas' },
      { name: 'canhao_confete', label: 'Canhão de Confete/Serpentina' },
      { name: 'mesa_iluminacao', label: 'Mesa de Iluminação', description: 'Controladores DMX' },
      { name: 'dimmer', label: 'Dimmer Racks', description: 'Controle de intensidade' },
      { name: 'followspot', label: 'Follow Spot', description: 'Canhão seguidor' },
      { name: 'iluminacao_arquitetural', label: 'Iluminação Arquitetural', description: 'Realce de fachadas' },
    ],
  },

  // ===== AUDIOVISUAL =====
  {
    name: 'audiovisual',
    label: 'Audiovisual',
    subtypes: [
      { name: 'telao_led', label: 'Telão LED', description: 'LED Wall outdoor/indoor' },
      { name: 'painel_led_p3', label: 'Painel LED P3', description: 'Indoor alta resolução' },
      { name: 'painel_led_p5', label: 'Painel LED P5', description: 'Indoor média resolução' },
      { name: 'painel_led_p10', label: 'Painel LED P10', description: 'Outdoor' },
      { name: 'projetor_10k', label: 'Projetor 10.000 Lumens', description: 'Alta luminosidade' },
      { name: 'projetor_5k', label: 'Projetor 5.000 Lumens', description: 'Média luminosidade' },
      { name: 'projetor_3k', label: 'Projetor 3.000 Lumens', description: 'Básico' },
      { name: 'tela_projecao', label: 'Tela de Projeção', description: 'Fast-fold, tripé' },
      { name: 'tvs_monitores', label: 'TVs e Monitores', description: 'Displays diversos' },
      { name: 'cameras_broadcast', label: 'Câmeras Broadcast', description: 'Profissionais' },
      { name: 'cameras_ptz', label: 'Câmeras PTZ', description: 'Robotizadas' },
      { name: 'switcher_video', label: 'Switcher de Vídeo', description: 'Mixer de vídeo' },
      { name: 'streaming_encoder', label: 'Encoder de Streaming', description: 'Transmissão ao vivo' },
      { name: 'gravacao_video', label: 'Gravação de Vídeo', description: 'Registro do evento' },
    ],
  },

  // ===== ESTRUTURAS =====
  {
    name: 'estruturas',
    label: 'Estruturas',
    subtypes: [
      { name: 'palco_6x4', label: 'Palco 6x4m', description: 'Pequeno porte' },
      { name: 'palco_8x6', label: 'Palco 8x6m', description: 'Médio porte' },
      { name: 'palco_10x8', label: 'Palco 10x8m', description: 'Grande porte' },
      { name: 'palco_customizado', label: 'Palco Customizado', description: 'Sob medida' },
      { name: 'tablado', label: 'Tablado', description: 'Piso elevado' },
      { name: 'passarela', label: 'Passarela', description: 'Para desfiles' },
      { name: 'tenda_piramidal', label: 'Tenda Piramidal', description: 'Diversos tamanhos' },
      { name: 'tenda_chapeu_bruxa', label: 'Tenda Chapéu de Bruxa' },
      { name: 'tenda_cristal', label: 'Tenda Cristal', description: 'Transparente' },
      { name: 'cobertura_lona', label: 'Cobertura de Lona' },
      { name: 'box_truss', label: 'Box Truss', description: 'Treliça estrutural' },
      { name: 'tower_truss', label: 'Tower Truss', description: 'Torres de som/luz' },
      { name: 'roof_system', label: 'Roof System', description: 'Cobertura de palco' },
      { name: 'camarote', label: 'Camarote', description: 'Estrutura VIP' },
      { name: 'arquibancada', label: 'Arquibancada' },
      { name: 'grades_seguranca', label: 'Grades de Segurança', description: 'Crowd barrier' },
      { name: 'fechamento_alambrado', label: 'Fechamento Alambrado' },
      { name: 'cercas_plasticas', label: 'Cercas Plásticas' },
    ],
  },

  // ===== MOBILIÁRIO =====
  {
    name: 'mobiliario',
    label: 'Mobiliário',
    subtypes: [
      { name: 'mesas_redondas', label: 'Mesas Redondas', description: '8, 10, 12 lugares' },
      { name: 'mesas_retangulares', label: 'Mesas Retangulares' },
      { name: 'mesas_quadradas', label: 'Mesas Quadradas' },
      { name: 'mesas_bistro', label: 'Mesas Bistrô', description: 'Altas' },
      { name: 'cadeiras_ferro', label: 'Cadeiras de Ferro' },
      { name: 'cadeiras_plastico', label: 'Cadeiras de Plástico' },
      { name: 'cadeiras_madeira', label: 'Cadeiras de Madeira' },
      { name: 'cadeiras_eames', label: 'Cadeiras Eames' },
      { name: 'sofas', label: 'Sofás', description: 'Diversos modelos' },
      { name: 'poltronas', label: 'Poltronas' },
      { name: 'puffs', label: 'Puffs' },
      { name: 'longarinas', label: 'Longarinas' },
      { name: 'aparadores', label: 'Aparadores' },
      { name: 'balcoes', label: 'Balcões', description: 'Bar, credenciamento' },
      { name: 'banquetas', label: 'Banquetas' },
    ],
  },

  // ===== DECORAÇÃO E CENOGRAFIA =====
  {
    name: 'decoracao',
    label: 'Decoração e Cenografia',
    subtypes: [
      { name: 'decoracao_tematica', label: 'Decoração Temática', description: 'Projetos personalizados' },
      { name: 'flores_arranjos', label: 'Flores e Arranjos' },
      { name: 'plantas_naturais', label: 'Plantas Naturais' },
      { name: 'plantas_artificiais', label: 'Plantas Artificiais' },
      { name: 'tapetes', label: 'Tapetes', description: 'Vermelhos, diversos' },
      { name: 'paineis_decorativos', label: 'Painéis Decorativos' },
      { name: 'backdrop', label: 'Backdrop', description: 'Fundo fotográfico' },
      { name: 'paineis_mdf', label: 'Painéis MDF' },
      { name: 'baloes_decorativos', label: 'Balões Decorativos' },
      { name: 'arcos_baloes', label: 'Arcos de Balões' },
      { name: 'cenografia_customizada', label: 'Cenografia Customizada' },
      { name: 'totens_decorativos', label: 'Totens Decorativos' },
      { name: 'cortinas_divisorias', label: 'Cortinas e Divisórias' },
      { name: 'forro_teto', label: 'Forro de Teto' },
      { name: 'iluminacao_decorativa', label: 'Iluminação Decorativa', description: 'Lustres, pendentes' },
    ],
  },

  // ===== ENERGIA E INFRAESTRUTURA =====
  {
    name: 'energia_infra',
    label: 'Energia e Infraestrutura',
    subtypes: [
      { name: 'gerador_20kva', label: 'Gerador 20 KVA' },
      { name: 'gerador_40kva', label: 'Gerador 40 KVA' },
      { name: 'gerador_60kva', label: 'Gerador 60 KVA' },
      { name: 'gerador_100kva', label: 'Gerador 100 KVA+' },
      { name: 'quadros_eletricos', label: 'Quadros Elétricos', description: 'Distribuição' },
      { name: 'cabos_eletricos', label: 'Cabos Elétricos' },
      { name: 'extensoes', label: 'Extensões e Tomadas' },
      { name: 'ar_condicionado_portatil', label: 'Ar Condicionado Portátil' },
      { name: 'ar_condicionado_split', label: 'Ar Condicionado Split' },
      { name: 'ventiladores_industriais', label: 'Ventiladores Industriais' },
      { name: 'climatizadores', label: 'Climatizadores' },
      { name: 'exaustores', label: 'Exaustores' },
      { name: 'nobreak', label: 'Nobreak/UPS' },
    ],
  },

  // ===== SANITÁRIOS E HIGIENE =====
  {
    name: 'sanitarios',
    label: 'Sanitários e Higiene',
    subtypes: [
      { name: 'banheiro_quimico_vip', label: 'Banheiro Químico VIP', description: 'Luxo' },
      { name: 'banheiro_quimico_standard', label: 'Banheiro Químico Standard' },
      { name: 'banheiro_pne', label: 'Banheiro PNE', description: 'Acessível' },
      { name: 'trailer_banheiro', label: 'Trailer de Banheiros' },
      { name: 'pias_portateis', label: 'Pias Portáteis' },
      { name: 'mictorio_portatil', label: 'Mictório Portátil' },
      { name: 'fraldario', label: 'Fraldário' },
    ],
  },

  // ===== CATERING E GASTRONOMIA =====
  {
    name: 'catering',
    label: 'Catering e Gastronomia',
    subtypes: [
      { name: 'buffet_completo', label: 'Buffet Completo' },
      { name: 'coquetel', label: 'Coquetel' },
      { name: 'coffee_break', label: 'Coffee Break' },
      { name: 'food_truck', label: 'Food Truck' },
      { name: 'churrasco', label: 'Churrasco' },
      { name: 'chopeira', label: 'Chopeira' },
      { name: 'maquina_cafe', label: 'Máquina de Café' },
      { name: 'equipamentos_cozinha', label: 'Equipamentos de Cozinha' },
      { name: 'refrigeradores', label: 'Refrigeradores e Freezers' },
      { name: 'bebidas', label: 'Bebidas', description: 'Fornecimento' },
    ],
  },

  // ===== SEGURANÇA E CONTROLE =====
  {
    name: 'seguranca',
    label: 'Segurança e Controle',
    subtypes: [
      { name: 'equipe_seguranca', label: 'Equipe de Segurança' },
      { name: 'cameras_vigilancia', label: 'Câmeras de Vigilância' },
      { name: 'detector_metal', label: 'Detector de Metal' },
      { name: 'controle_acesso', label: 'Controle de Acesso', description: 'Catracas, biometria' },
      { name: 'radios_comunicadores', label: 'Rádios Comunicadores' },
      { name: 'extintores', label: 'Extintores de Incêndio' },
      { name: 'sinalizacao_emergencia', label: 'Sinalização de Emergência' },
    ],
  },

  // ===== TECNOLOGIA E INTERATIVIDADE =====
  {
    name: 'tecnologia',
    label: 'Tecnologia e Interatividade',
    subtypes: [
      { name: 'wifi_eventos', label: 'Wi-Fi para Eventos', description: 'Internet de alta capacidade' },
      { name: 'hotspot', label: 'Hotspot Portátil' },
      { name: 'credenciamento_eletronico', label: 'Credenciamento Eletrônico' },
      { name: 'totens_interativos', label: 'Totens Interativos' },
      { name: 'tablets', label: 'Tablets' },
      { name: 'computadores', label: 'Computadores/Notebooks' },
      { name: 'impressoras', label: 'Impressoras' },
      { name: 'leitor_qrcode', label: 'Leitor QR Code' },
      { name: 'sistema_votacao', label: 'Sistema de Votação' },
      { name: 'aplicativo_evento', label: 'Aplicativo de Evento' },
    ],
  },

  // ===== TRANSPORTE DE EQUIPAMENTOS =====
  {
    name: 'transporte',
    label: 'Transporte de Equipamentos',
    subtypes: [
      { name: 'onibus', label: 'Ônibus/Van' },
      { name: 'caminhao_mudanca', label: 'Caminhão de Mudança' },
      { name: 'empilhadeira', label: 'Empilhadeira' },
      { name: 'carrinho_carga', label: 'Carrinho de Carga' },
      { name: 'estacionamento', label: 'Gestão de Estacionamento' },
      { name: 'manobrista', label: 'Manobrista' },
    ],
  },

  // ===== OUTROS SERVIÇOS =====
  {
    name: 'outros',
    label: 'Outros Serviços',
    subtypes: [
      { name: 'limpeza_pre_evento', label: 'Limpeza Pré-Evento' },
      { name: 'limpeza_pos_evento', label: 'Limpeza Pós-Evento' },
      { name: 'limpeza_durante_evento', label: 'Limpeza Durante Evento' },
      { name: 'mao_obra_montagem', label: 'Mão de Obra para Montagem' },
      { name: 'mao_obra_operacao', label: 'Mão de Obra para Operação' },
      { name: 'seguro_evento', label: 'Seguro de Evento' },
      { name: 'alvara_licencas', label: 'Alvará e Licenças' },
    ],
  },
];

/**
 * Retorna lista plana de todos os tipos de equipamento
 */
export function getAllEquipmentTypes(): string[] {
  const types: string[] = [];
  EQUIPMENT_CATEGORIES.forEach(category => {
    category.subtypes.forEach(subtype => {
      types.push(subtype.label);
    });
  });
  return types;
}

/**
 * Retorna lista de tipos por categoria
 */
export function getEquipmentTypesByCategory(categoryName: string): string[] {
  const category = EQUIPMENT_CATEGORIES.find(c => c.name === categoryName);
  return category ? category.subtypes.map(s => s.label) : [];
}

/**
 * Retorna descrição de um tipo de equipamento
 */
export function getEquipmentDescription(equipmentLabel: string): string | undefined {
  for (const category of EQUIPMENT_CATEGORIES) {
    const subtype = category.subtypes.find(s => s.label === equipmentLabel);
    if (subtype) return subtype.description;
  }
  return undefined;
}

/**
 * Total de tipos de equipamento disponíveis
 */
export const TOTAL_EQUIPMENT_TYPES = EQUIPMENT_CATEGORIES.reduce(
  (sum, cat) => sum + cat.subtypes.length,
  0
);
