/**
 * Tipos para o Sistema de Catálogo de Equipamentos
 */

export interface EquipmentCatalogItem {
  // Identificação
  id: string; // UUID único do item
  category: string; // "som_audio", "iluminacao", etc
  subcategory: string; // "sistema_som_completo", "line_array", etc

  // Detalhamento
  name: string; // "Sistema de Som Completo - 500 pessoas"
  description: string; // Descrição detalhada

  // Especificações Técnicas (LIVRE - admin define os campos)
  specifications: Record<string, string | number>;
  // Exemplos:
  // {
  //   capacidade_pessoas: 500,
  //   potencia_rms: "10.000W",
  //   marca: "JBL",
  //   modelo: "VRX932LA",
  //   quantidade_caixas: 4,
  //   quantidade_subs: 2,
  //   alcance_metros: 50
  // }

  // Pricing Detalhado
  pricing: {
    daily?: number; // Diária
    three_days?: number; // 3 dias
    weekly?: number; // Semanal
    monthly?: number; // Mensal
    custom_periods?: {
      // Períodos customizados
      period: string; // "Final de semana", "Feriado", etc
      price: number;
    }[];
  };

  // Extras/Adicionais
  extras?: {
    name: string; // "Técnico de som", "Transporte", etc
    price: number;
    unit: string; // "por dia", "por hora", "fixo"
  }[];

  // Mídia
  photos?: string[]; // URLs de fotos
  videos?: string[]; // URLs de vídeos
  documents?: string[]; // PDFs técnicos, catálogos

  // Disponibilidade
  availability: {
    status: 'available' | 'unavailable' | 'limited';
    quantity: number; // Quantidade disponível
    min_rental_days?: number; // Mínimo de dias de locação
    notes?: string;
  };

  // Metadata
  created_at: string;
  updated_at: string;
  is_featured: boolean; // Destaque no catálogo
  is_active: boolean; // Ativo/Inativo
}

export interface EquipmentCatalogFormData {
  // Passo 1: Categoria
  category: string;
  subcategory: string;

  // Passo 2: Info Básicas
  name: string;
  description: string;

  // Passo 3: Especificações (dinâmico)
  specifications: Array<{
    key: string;
    value: string;
  }>;

  // Passo 4: Preços
  pricing: {
    daily?: string;
    three_days?: string;
    weekly?: string;
    monthly?: string;
    custom_periods?: Array<{
      period: string;
      price: string;
    }>;
  };

  // Passo 5: Extras
  extras?: Array<{
    name: string;
    price: string;
    unit: string;
  }>;

  // Passo 6: Mídia
  photos?: string[];
  videos?: string[];
  documents?: string[];

  // Passo 7: Disponibilidade
  availability: {
    status: 'available' | 'unavailable' | 'limited';
    quantity: string;
    min_rental_days?: string;
    notes?: string;
  };

  is_featured: boolean;
  is_active: boolean;
}
