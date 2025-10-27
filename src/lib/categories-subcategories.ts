/**
 * Mapeamento Completo de Categorias e Subcategorias de Profissionais para Eventos
 *
 * Abrange: Eventos Corporativos, Feiras, Festivais, Convenções, Shows, Exposições, etc.
 */

export interface SubcategoryConfig {
  name: string;
  label: string;
  requiredDocuments: string[]; // Documentos obrigatórios além dos básicos (RG, CPF, Comprovante)
  description?: string;
}

export interface CategoryConfig {
  name: string;
  label: string;
  subcategories: SubcategoryConfig[];
}

/**
 * Documentos base obrigatórios para TODOS os profissionais:
 * - RG (frente e verso)
 * - CPF
 * - Comprovante de Residência
 * - Foto
 */

/**
 * Mapeamento completo de categorias e subcategorias para eventos
 * ORDENADO ALFABETICAMENTE por categoria e subcategoria
 */
export const CATEGORIES_WITH_SUBCATEGORIES: CategoryConfig[] = [
  // ===========================
  // 1. ALIMENTAÇÃO E BEBIDAS
  // ===========================
  {
    name: 'Alimentação e Bebidas',
    label: 'Alimentação e Bebidas',
    subcategories: [
      {
        name: 'auxiliar_cozinha',
        label: 'Auxiliar de Cozinha',
        requiredDocuments: [],
        description: 'Apoio na cozinha'
      },
      {
        name: 'barman',
        label: 'Barman/Bartender',
        requiredDocuments: [],
        description: 'Preparo de bebidas'
      },
      {
        name: 'chef',
        label: 'Chef de Cozinha',
        requiredDocuments: ['portfolio'],
        description: 'Responsável pela cozinha'
      },
      {
        name: 'copeiro',
        label: 'Copeiro(a)',
        requiredDocuments: [],
        description: 'Serviços de copa'
      },
      {
        name: 'cozinheiro',
        label: 'Cozinheiro(a)',
        requiredDocuments: [],
        description: 'Preparo de alimentos'
      },
      {
        name: 'garcom',
        label: 'Garçom/Garçonete',
        requiredDocuments: [],
        description: 'Serviço de mesa'
      }
    ]
  },

  // ===========================
  // 2. ANIMAÇÃO E ENTRETENIMENTO
  // ===========================
  {
    name: 'Entretenimento',
    label: 'Animação e Entretenimento',
    subcategories: [
      {
        name: 'animador',
        label: 'Animador(a)',
        requiredDocuments: [],
        description: 'Animação de eventos'
      },
      {
        name: 'dj',
        label: 'DJ',
        requiredDocuments: ['portfolio'],
        description: 'Disc Jockey'
      },
      {
        name: 'mc',
        label: 'MC/Apresentador',
        requiredDocuments: [],
        description: 'Mestre de cerimônias'
      },
      {
        name: 'musico',
        label: 'Músico',
        requiredDocuments: ['portfolio'],
        description: 'Performance musical'
      },
      {
        name: 'performer',
        label: 'Performer',
        requiredDocuments: ['portfolio'],
        description: 'Performance artística'
      }
    ]
  },

  // ===========================
  // 3. APOIO OPERACIONAL
  // ===========================
  {
    name: 'Apoio Operacional',
    label: 'Apoio Operacional',
    subcategories: [
      {
        name: 'fiscal_sala',
        label: 'Fiscal de Sala',
        requiredDocuments: [],
        description: 'Organização de salas'
      },
      {
        name: 'orientador',
        label: 'Orientador(a)',
        requiredDocuments: [],
        description: 'Orientação de público'
      },
      {
        name: 'runner',
        label: 'Runner',
        requiredDocuments: [],
        description: 'Execução rápida de tarefas'
      },
      {
        name: 'staff_geral',
        label: 'Staff Geral',
        requiredDocuments: [],
        description: 'Apoio operacional geral'
      }
    ]
  },

  // ===========================
  // 4. DECORAÇÃO E AMBIENTAÇÃO
  // ===========================
  {
    name: 'Decoração',
    label: 'Decoração e Ambientação',
    subcategories: [
      {
        name: 'decorador',
        label: 'Decorador(a)',
        requiredDocuments: [],
        description: 'Decoração de ambientes'
      },
      {
        name: 'florista',
        label: 'Florista',
        requiredDocuments: [],
        description: 'Arranjos florais'
      },
      {
        name: 'montador_decoracao',
        label: 'Montador de Decoração',
        requiredDocuments: [],
        description: 'Montagem de decoração'
      }
    ]
  },

  // ===========================
  // 5. ELETRICIDADE E ENERGIA
  // ===========================
  {
    name: 'Eletricidade',
    label: 'Eletricidade e Energia',
    subcategories: [
      {
        name: 'eletricista',
        label: 'Eletricista',
        requiredDocuments: [],
        description: 'Instalações elétricas'
      },
      {
        name: 'eletricista_nr10',
        label: 'Eletricista (NR10)',
        requiredDocuments: ['nr10'],
        description: 'Trabalho em alta tensão'
      },
      {
        name: 'gerador_operador',
        label: 'Operador de Gerador',
        requiredDocuments: [],
        description: 'Operação de geradores'
      }
    ]
  },

  // ===========================
  // 6. FOTOGRAFIA E FILMAGEM
  // ===========================
  {
    name: 'Fotografia e Filmagem',
    label: 'Fotografia e Filmagem',
    subcategories: [
      {
        name: 'fotografo',
        label: 'Fotógrafo',
        requiredDocuments: ['portfolio'],
        description: 'Fotografia profissional'
      },
      {
        name: 'camera_operator',
        label: 'Operador de Câmera',
        requiredDocuments: [],
        description: 'Operação de câmeras de vídeo'
      },
      {
        name: 'drone_pilot',
        label: 'Piloto de Drone',
        requiredDocuments: ['certificado_anac'],
        description: 'Filmagem aérea com drone'
      },
      {
        name: 'videomaker',
        label: 'Videomaker',
        requiredDocuments: ['portfolio'],
        description: 'Captação e edição de vídeo'
      }
    ]
  },

  // ===========================
  // 7. GESTÃO DE RESÍDUOS
  // ===========================
  {
    name: 'Gestão de Resíduos',
    label: 'Gestão de Resíduos',
    subcategories: [
      {
        name: 'coletor_residuos',
        label: 'Coletor de Resíduos',
        requiredDocuments: [],
        description: 'Coleta de lixo e reciclagem'
      },
      {
        name: 'supervisor_ambiental',
        label: 'Supervisor Ambiental',
        requiredDocuments: [],
        description: 'Supervisão de gestão ambiental'
      }
    ]
  },

  // ===========================
  // 8. INFORMÁTICA E TI
  // ===========================
  {
    name: 'TI',
    label: 'Informática e TI',
    subcategories: [
      {
        name: 'operador_sistemas',
        label: 'Operador de Sistemas',
        requiredDocuments: [],
        description: 'Operação de sistemas'
      },
      {
        name: 'suporte_ti',
        label: 'Suporte de TI',
        requiredDocuments: [],
        description: 'Suporte técnico de informática'
      },
      {
        name: 'tecnico_informatica',
        label: 'Técnico de Informática',
        requiredDocuments: [],
        description: 'Manutenção de equipamentos'
      }
    ]
  },

  // ===========================
  // 9. LIMPEZA E CONSERVAÇÃO
  // ===========================
  {
    name: 'Limpeza',
    label: 'Limpeza e Conservação',
    subcategories: [
      {
        name: 'auxiliar_limpeza',
        label: 'Auxiliar de Limpeza',
        requiredDocuments: [],
        description: 'Limpeza geral'
      },
      {
        name: 'gari',
        label: 'Gari',
        requiredDocuments: [],
        description: 'Limpeza de áreas externas'
      },
      {
        name: 'supervisor_limpeza',
        label: 'Supervisor de Limpeza',
        requiredDocuments: [],
        description: 'Supervisão de equipe de limpeza'
      }
    ]
  },

  // ===========================
  // 10. MONTAGEM E DESMONTAGEM
  // ===========================
  {
    name: 'Montagem e Desmontagem',
    label: 'Montagem e Desmontagem',
    subcategories: [
      {
        name: 'ajudante_geral',
        label: 'Ajudante Geral',
        requiredDocuments: [],
        description: 'Apoio geral em montagem'
      },
      {
        name: 'carpinteiro',
        label: 'Carpinteiro',
        requiredDocuments: [],
        description: 'Serviços de carpintaria'
      },
      {
        name: 'montador',
        label: 'Montador',
        requiredDocuments: [],
        description: 'Montagem de estruturas'
      },
      {
        name: 'montador_nr35',
        label: 'Montador (NR35)',
        requiredDocuments: ['nr35'],
        description: 'Montador com trabalho em altura'
      }
    ]
  },

  // ===========================
  // 11. PALCO E CENOGRAFIA
  // ===========================
  {
    name: 'Palco e Cenografia',
    label: 'Palco e Cenografia',
    subcategories: [
      {
        name: 'cenografo',
        label: 'Cenógrafo',
        requiredDocuments: [],
        description: 'Criação e montagem de cenários'
      },
      {
        name: 'cenotecnico',
        label: 'Cenotécnico',
        requiredDocuments: [],
        description: 'Execução técnica de cenografia'
      },
      {
        name: 'contra_regra',
        label: 'Contra-regra',
        requiredDocuments: [],
        description: 'Organização de palco e bastidores'
      },
      {
        name: 'operador_fly',
        label: 'Operador de Fly',
        requiredDocuments: ['nr35'],
        description: 'Operação de sistemas aéreos'
      }
    ]
  },

  // ===========================
  // 12. PRODUÇÃO E COORDENAÇÃO
  // ===========================
  {
    name: 'Produção e Coordenação',
    label: 'Produção e Coordenação',
    subcategories: [
      {
        name: 'assistente_producao',
        label: 'Assistente de Produção',
        requiredDocuments: [],
        description: 'Apoio à produção'
      },
      {
        name: 'coordenador_evento',
        label: 'Coordenador de Evento',
        requiredDocuments: [],
        description: 'Coordenação operacional do evento'
      },
      {
        name: 'produtor_executivo',
        label: 'Produtor Executivo',
        requiredDocuments: [],
        description: 'Coordenação geral do evento'
      },
      {
        name: 'supervisor_operacional',
        label: 'Supervisor Operacional',
        requiredDocuments: [],
        description: 'Supervisão de equipes operacionais'
      }
    ]
  },

  // ===========================
  // 13. PROMOTORES E DEMONSTRADORES
  // ===========================
  {
    name: 'Promotores',
    label: 'Promotores e Demonstradores',
    subcategories: [
      {
        name: 'demonstrador',
        label: 'Demonstrador(a)',
        requiredDocuments: [],
        description: 'Demonstração de produtos'
      },
      {
        name: 'panfleteiro',
        label: 'Panfleteiro(a)',
        requiredDocuments: [],
        description: 'Distribuição de material'
      },
      {
        name: 'promotor_vendas',
        label: 'Promotor(a) de Vendas',
        requiredDocuments: [],
        description: 'Promoção de produtos'
      },
      {
        name: 'repositor',
        label: 'Repositor(a)',
        requiredDocuments: [],
        description: 'Reposição de produtos'
      }
    ]
  },

  // ===========================
  // 14. RECEPÇÃO E CREDENCIAMENTO
  // ===========================
  {
    name: 'Recepção e Credenciamento',
    label: 'Recepção e Credenciamento',
    subcategories: [
      {
        name: 'concierge',
        label: 'Concierge',
        requiredDocuments: [],
        description: 'Atendimento VIP e informações'
      },
      {
        name: 'credenciador',
        label: 'Credenciador',
        requiredDocuments: [],
        description: 'Credenciamento de participantes'
      },
      {
        name: 'hostess',
        label: 'Hostess/Host',
        requiredDocuments: [],
        description: 'Recepção e orientação de convidados'
      },
      {
        name: 'recepcionista',
        label: 'Recepcionista',
        requiredDocuments: [],
        description: 'Recepção e atendimento'
      }
    ]
  },

  // ===========================
  // 15. SAÚDE E SEGURANÇA DO TRABALHO
  // ===========================
  {
    name: 'Saúde',
    label: 'Saúde e Segurança do Trabalho',
    subcategories: [
      {
        name: 'brigadista',
        label: 'Brigadista',
        requiredDocuments: ['nr23'],
        description: 'Brigada de incêndio'
      },
      {
        name: 'enfermeiro',
        label: 'Enfermeiro(a)',
        requiredDocuments: ['coren'],
        description: 'Atendimento de enfermagem'
      },
      {
        name: 'medico',
        label: 'Médico(a)',
        requiredDocuments: ['crm'],
        description: 'Atendimento médico'
      },
      {
        name: 'socorrista',
        label: 'Socorrista',
        requiredDocuments: ['curso_primeiros_socorros'],
        description: 'Primeiros socorros'
      },
      {
        name: 'tecnico_enfermagem',
        label: 'Técnico de Enfermagem',
        requiredDocuments: ['coren'],
        description: 'Suporte de enfermagem'
      }
    ]
  },

  // ===========================
  // 16. SEGURANÇA E CONTROLE DE ACESSO
  // ===========================
  {
    name: 'Segurança',
    label: 'Segurança e Controle de Acesso',
    subcategories: [
      {
        name: 'controlador_acesso',
        label: 'Controlador de Acesso',
        requiredDocuments: [],
        description: 'Controle de entrada e saída'
      },
      {
        name: 'porteiro',
        label: 'Porteiro',
        requiredDocuments: [],
        description: 'Portaria e recepção de acessos'
      },
      {
        name: 'seguranca_patrimonial',
        label: 'Segurança Patrimonial',
        requiredDocuments: [],
        description: 'Segurança desarmado'
      },
      {
        name: 'seguranca_pessoal',
        label: 'Segurança Pessoal',
        requiredDocuments: ['cnv'],
        description: 'Proteção de pessoas VIP'
      },
      {
        name: 'vigilante',
        label: 'Vigilante',
        requiredDocuments: ['cnv'],
        description: 'Vigilante com CNV (Carteira Nacional de Vigilante)'
      }
    ]
  },

  // ===========================
  // 17. TÉCNICOS AUDIOVISUAIS
  // ===========================
  {
    name: 'Técnicos Audiovisuais',
    label: 'Técnicos Audiovisuais',
    subcategories: [
      {
        name: 'operador_projetor',
        label: 'Operador de Projetor',
        requiredDocuments: [],
        description: 'Operação de projetores'
      },
      {
        name: 'streaming_operator',
        label: 'Operador de Streaming',
        requiredDocuments: [],
        description: 'Transmissão online de eventos'
      },
      {
        name: 'tec_iluminacao',
        label: 'Técnico de Iluminação',
        requiredDocuments: ['drt'],
        description: 'Operação de equipamentos de iluminação'
      },
      {
        name: 'tec_som',
        label: 'Técnico de Som',
        requiredDocuments: ['drt'],
        description: 'Operação de equipamentos de áudio'
      },
      {
        name: 'tec_video',
        label: 'Técnico de Vídeo',
        requiredDocuments: ['drt'],
        description: 'Operação de câmeras e vídeo'
      }
    ]
  },

  // ===========================
  // 18. TRADUÇÃO E INTERPRETAÇÃO
  // ===========================
  {
    name: 'Tradução',
    label: 'Tradução e Interpretação',
    subcategories: [
      {
        name: 'interprete_libras',
        label: 'Intérprete de LIBRAS',
        requiredDocuments: ['certificado_libras'],
        description: 'Tradução para língua de sinais'
      },
      {
        name: 'interprete_simultaneo',
        label: 'Intérprete Simultâneo',
        requiredDocuments: ['certificado_traducao'],
        description: 'Tradução simultânea'
      },
      {
        name: 'tradutor',
        label: 'Tradutor',
        requiredDocuments: [],
        description: 'Tradução de textos'
      }
    ]
  },

  // ===========================
  // 19. TRANSPORTE E LOGÍSTICA
  // ===========================
  {
    name: 'Transporte e Logística',
    label: 'Transporte e Logística',
    subcategories: [
      {
        name: 'auxiliar_logistica',
        label: 'Auxiliar de Logística',
        requiredDocuments: [],
        description: 'Apoio logístico'
      },
      {
        name: 'manobrista',
        label: 'Manobrista',
        requiredDocuments: ['cnh'],
        description: 'Serviço de valet'
      },
      {
        name: 'motorista_cat_b',
        label: 'Motorista (Cat. B)',
        requiredDocuments: ['cnh'],
        description: 'Carros de passeio'
      },
      {
        name: 'motorista_cat_d',
        label: 'Motorista (Cat. D)',
        requiredDocuments: ['cnh'],
        description: 'Ônibus e vans'
      },
      {
        name: 'motorista_cat_e',
        label: 'Motorista (Cat. E)',
        requiredDocuments: ['cnh'],
        description: 'Caminhões e carretas'
      },
      {
        name: 'operador_empilhadeira',
        label: 'Operador de Empilhadeira',
        requiredDocuments: ['cnh', 'curso_empilhadeira'],
        description: 'Operação de empilhadeira'
      }
    ]
  },

  // ===========================
  // 20. VENDAS E BILHETERIA
  // ===========================
  {
    name: 'Vendas',
    label: 'Vendas e Bilheteria',
    subcategories: [
      {
        name: 'bilheteiro',
        label: 'Bilheteiro(a)',
        requiredDocuments: [],
        description: 'Venda de ingressos'
      },
      {
        name: 'operador_caixa',
        label: 'Operador(a) de Caixa',
        requiredDocuments: [],
        description: 'Operação de caixa'
      },
      {
        name: 'vendedor',
        label: 'Vendedor(a)',
        requiredDocuments: [],
        description: 'Vendas em geral'
      }
    ]
  }
];

/**
 * Mapeamento de códigos de documentos para labels
 */
export const DOCUMENT_LABELS: Record<string, string> = {
  // Documentos básicos
  'rg_front': 'RG (Frente)',
  'rg_back': 'RG (Verso)',
  'cpf': 'CPF',
  'proof_of_address': 'Comprovante de Residência',
  'profile_photo': 'Foto',

  // Documentos específicos
  'cnh': 'CNH (Carteira Nacional de Habilitação)',
  'cnv': 'CNV (Carteira Nacional de Vigilante)',
  'coren': 'COREN (Registro no Conselho de Enfermagem)',
  'crm': 'CRM (Registro no Conselho de Medicina)',
  'drt': 'DRT (Registro Profissional)',
  'nr10': 'NR10 (Certificado de Trabalho em Eletricidade)',
  'nr23': 'NR23 (Certificado de Brigadista)',
  'nr35': 'NR35 (Certificado de Trabalho em Altura)',
  'curso_primeiros_socorros': 'Curso de Primeiros Socorros',
  'curso_empilhadeira': 'Certificado de Operador de Empilhadeira',
  'certificado_anac': 'Certificado ANAC (Piloto de Drone)',
  'certificado_traducao': 'Certificado de Tradutor/Intérprete',
  'certificado_libras': 'Certificado de Intérprete de LIBRAS',
  'portfolio': 'Portfólio',
};

/**
 * Obter subcategorias de uma categoria
 */
export function getSubcategories(categoryName: string): SubcategoryConfig[] {
  const category = CATEGORIES_WITH_SUBCATEGORIES.find(c => c.name === categoryName);
  return category?.subcategories || [];
}

/**
 * Obter documentos requeridos para uma subcategoria
 */
export function getRequiredDocuments(categoryName: string, subcategoryName: string): string[] {
  const subcategories = getSubcategories(categoryName);
  const subcategory = subcategories.find(s => s.name === subcategoryName);
  return subcategory?.requiredDocuments || [];
}

/**
 * Verificar se uma subcategoria requer documentos específicos
 */
export function requiresSpecialDocuments(categoryName: string, subcategoryName: string): boolean {
  const docs = getRequiredDocuments(categoryName, subcategoryName);
  return docs.length > 0;
}

/**
 * Obter todas as categorias (apenas nomes)
 */
export function getAllCategoryNames(): string[] {
  return CATEGORIES_WITH_SUBCATEGORIES.map(c => c.name);
}

/**
 * Obter total de subcategorias
 */
export function getTotalSubcategories(): number {
  return CATEGORIES_WITH_SUBCATEGORIES.reduce((total, cat) => total + cat.subcategories.length, 0);
}

/**
 * Obter categoria pai de uma subcategoria
 */
export function getCategoryForSubcategory(subcategoryName: string): string | null {
  for (const category of CATEGORIES_WITH_SUBCATEGORIES) {
    const hasSubcategory = category.subcategories.some(sub => sub.name === subcategoryName);
    if (hasSubcategory) {
      return category.name;
    }
  }
  return null;
}

/**
 * Obter informações completas de uma subcategoria
 */
export function getSubcategoryInfo(subcategoryName: string): SubcategoryConfig | null {
  for (const category of CATEGORIES_WITH_SUBCATEGORIES) {
    const subcategory = category.subcategories.find(sub => sub.name === subcategoryName);
    if (subcategory) {
      return subcategory;
    }
  }
  return null;
}

/**
 * Obter todos os documentos obrigatórios para uma lista de subcategorias
 * (união de documentos básicos + documentos específicos de cada subcategoria)
 */
export function getRequiredDocumentsForSubcategories(subcategoryNames: string[]): string[] {
  const basicDocs = ['rg_front', 'rg_back', 'cpf', 'proof_of_address'];
  const specificDocs = new Set<string>();

  subcategoryNames.forEach(subcategoryName => {
    const subcategory = getSubcategoryInfo(subcategoryName);
    if (subcategory && subcategory.requiredDocuments) {
      subcategory.requiredDocuments.forEach(doc => specificDocs.add(doc));
    }
  });

  return [...basicDocs, ...Array.from(specificDocs)];
}
