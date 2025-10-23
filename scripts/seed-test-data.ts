/**
 * Script de Seed - Dados de Teste
 *
 * Cria:
 * - 5 Profissionais (São Paulo, email: erickrussomat@gmail.com)
 * - 5 Fornecedores (São Paulo, email: erickrussomat@gmail.com)
 * - 2 Projetos de teste (São Paulo)
 * - Geocodifica todos automaticamente
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente faltando!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Email de teste
const TEST_EMAIL = 'erickrussomat@gmail.com';

// Dados de profissionais
const PROFESSIONALS = [
  {
    full_name: 'Carlos Silva',
    email: TEST_EMAIL,
    phone: '(11) 98765-4321',
    cpf: '123.456.789-01',
    birth_date: '1990-05-15',
    categories: ['Fotografia', 'Videomaker'],
    has_experience: true,
    experience_description: 'Fotógrafo profissional com 10 anos de experiência em eventos corporativos e sociais',
    years_of_experience: '10+',
    street: 'Av. Paulista',
    number: '1578',
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP',
    cep: '01310-200',
    status: 'approved',
    availability: {}
  },
  {
    full_name: 'Maria Santos',
    email: TEST_EMAIL,
    phone: '(11) 91234-5678',
    cpf: '234.567.890-12',
    birth_date: '1988-08-20',
    categories: ['DJ', 'Iluminação'],
    has_experience: true,
    experience_description: 'DJ e técnica de iluminação especializada em festas e eventos',
    years_of_experience: '5-10',
    street: 'Rua Augusta',
    number: '2000',
    neighborhood: 'Consolação',
    city: 'São Paulo',
    state: 'SP',
    cep: '01304-000',
    status: 'approved',
    availability: {}
  },
  {
    full_name: 'João Oliveira',
    email: TEST_EMAIL,
    phone: '(11) 99876-5432',
    cpf: '345.678.901-23',
    birth_date: '1985-03-10',
    categories: ['Segurança', 'Recepção'],
    has_experience: true,
    experience_description: 'Profissional de segurança com certificação e experiência em grandes eventos',
    years_of_experience: '10+',
    street: 'Av. Faria Lima',
    number: '3000',
    neighborhood: 'Itaim Bibi',
    city: 'São Paulo',
    state: 'SP',
    cep: '01452-000',
    status: 'approved',
    availability: {}
  },
  {
    full_name: 'Ana Costa',
    email: TEST_EMAIL,
    phone: '(11) 97777-8888',
    cpf: '456.789.012-34',
    birth_date: '1992-11-25',
    categories: ['Garçom', 'Barman'],
    has_experience: true,
    experience_description: 'Garçonete e bartender com especialização em eventos premium',
    years_of_experience: '3-5',
    street: 'Rua Oscar Freire',
    number: '500',
    neighborhood: 'Jardins',
    city: 'São Paulo',
    state: 'SP',
    cep: '01426-000',
    status: 'approved',
    availability: {}
  },
  {
    full_name: 'Pedro Almeida',
    email: TEST_EMAIL,
    phone: '(11) 96666-7777',
    cpf: '567.890.123-45',
    birth_date: '1995-07-30',
    categories: ['Som', 'Audiovisual'],
    has_experience: true,
    experience_description: 'Técnico de som e audiovisual especializado em eventos ao vivo',
    years_of_experience: '3-5',
    street: 'Av. Brigadeiro Faria Lima',
    number: '1500',
    neighborhood: 'Pinheiros',
    city: 'São Paulo',
    state: 'SP',
    cep: '01451-000',
    status: 'approved',
    availability: {}
  }
];

// Dados de fornecedores (com MUITOS equipamentos!)
const SUPPLIERS = [
  {
    company_name: 'SP Som & Luz Ltda',
    contact_name: 'Roberto Mendes',
    email: TEST_EMAIL,
    phone: '(11) 3000-1000',
    equipment_types: [
      'Som',
      'Iluminação',
      'Palco',
      'Audiovisual',
      'Projeção',
      'LED',
      'Mesa de Som',
      'Microfones',
      'Caixas de Som',
      'Amplificadores',
      'Refletores',
      'Moving Lights',
      'Strobo',
      'Laser',
      'Fumaça',
      'Truss',
      'Estruturas Metálicas'
    ],
    address: 'Av. Rebouças, 3000',
    city: 'São Paulo',
    state: 'SP',
    zip_code: '05401-300',
    notes: 'Fornecedor COMPLETO de equipamentos de som, iluminação e estruturas profissionais. Atende desde pequenos eventos até festivais de grande porte.',
    status: 'active'
  },
  {
    company_name: 'Mega Tendas e Coberturas',
    contact_name: 'Fernanda Lima',
    email: TEST_EMAIL,
    phone: '(11) 3100-2000',
    equipment_types: [
      'Tendas',
      'Coberturas',
      'Estruturas',
      'Tendas Piramidais',
      'Tendas Sanfonadas',
      'Tendas Cristal',
      'Palco',
      'Tablado',
      'Passarelas',
      'Arquibancadas',
      'Divisórias',
      'Fechamentos Laterais',
      'Piso Elevado',
      'Carpetes'
    ],
    address: 'Rua dos Pinheiros, 800',
    city: 'São Paulo',
    state: 'SP',
    zip_code: '05422-001',
    notes: 'Especializada em tendas, coberturas e estruturas para eventos de TODOS os portes. Equipamentos novos e em excelente estado.',
    status: 'active'
  },
  {
    company_name: 'Buffet Gourmet SP',
    contact_name: 'Chef Ricardo Santos',
    email: TEST_EMAIL,
    phone: '(11) 3200-3000',
    equipment_types: [
      'Buffet',
      'Catering',
      'Gastronomia',
      'Coffee Break',
      'Coquetel',
      'Jantar',
      'Almoço',
      'Café da Manhã',
      'Bebidas',
      'Bar',
      'Chopeira',
      'Máquina de Café',
      'Utensílios de Cozinha',
      'Pratos',
      'Talheres',
      'Copos',
      'Taças'
    ],
    address: 'Rua Haddock Lobo, 1200',
    city: 'São Paulo',
    state: 'SP',
    zip_code: '01414-001',
    notes: 'Buffet COMPLETO com gastronomia premium, bebidas e toda estrutura necessária. Cardápios personalizados.',
    status: 'active'
  },
  {
    company_name: 'Móveis & Decoração Eventos',
    contact_name: 'Juliana Rocha',
    email: TEST_EMAIL,
    phone: '(11) 3300-4000',
    equipment_types: [
      'Mobiliário',
      'Decoração',
      'Flores',
      'Mesas',
      'Cadeiras',
      'Sofás',
      'Poltronas',
      'Banquetas',
      'Balcões',
      'Aparadores',
      'Toalhas de Mesa',
      'Capas de Cadeiras',
      'Arranjos Florais',
      'Vasos',
      'Plantas',
      'Cortinas',
      'Painéis Decorativos',
      'Tapetes'
    ],
    address: 'Av. Ibirapuera, 2500',
    city: 'São Paulo',
    state: 'SP',
    zip_code: '04029-200',
    notes: 'Locação de móveis e decoração COMPLETA para eventos. Catálogo com mais de 500 itens disponíveis.',
    status: 'active'
  },
  {
    company_name: 'Tech AV Soluções',
    contact_name: 'Marcos Ferreira',
    email: TEST_EMAIL,
    phone: '(11) 3400-5000',
    equipment_types: [
      'Audiovisual',
      'Projeção',
      'LED',
      'Telão',
      'Projetores 4K',
      'Telas de Projeção',
      'Painéis de LED',
      'TVs',
      'Monitores',
      'Computadores',
      'Notebooks',
      'Tablets',
      'Câmeras',
      'Transmissão ao Vivo',
      'Streaming',
      'Videoconferência',
      'Internet'
    ],
    address: 'Rua Vergueiro, 5000',
    city: 'São Paulo',
    state: 'SP',
    zip_code: '04101-000',
    notes: 'Equipamentos de audiovisual de ÚLTIMA GERAÇÃO. Especialistas em transmissão ao vivo e eventos híbridos.',
    status: 'active'
  },
  {
    company_name: 'Clima Conforto Eventos',
    contact_name: 'André Cardoso',
    email: TEST_EMAIL,
    phone: '(11) 3500-6000',
    equipment_types: [
      'Ar Condicionado',
      'Climatização',
      'Ventiladores',
      'Aquecedores',
      'Geradores',
      'Energia',
      'Nobreaks',
      'Extensões',
      'Quadros de Força',
      'Iluminação de Emergência'
    ],
    address: 'Av. Paulista, 2500',
    city: 'São Paulo',
    state: 'SP',
    zip_code: '01310-300',
    notes: 'Climatização e infraestrutura elétrica para eventos. Geradores de todas as potências.',
    status: 'active'
  },
  {
    company_name: 'Segurança Total Eventos',
    contact_name: 'Capitão Silva',
    email: TEST_EMAIL,
    phone: '(11) 3600-7000',
    equipment_types: [
      'Segurança',
      'Vigilância',
      'Câmeras',
      'CFTV',
      'Catracas',
      'Detectores de Metal',
      'Grades',
      'Cordões de Isolamento',
      'Sinalização',
      'Extintores',
      'Primeiros Socorros'
    ],
    address: 'Rua Consolação, 1000',
    city: 'São Paulo',
    state: 'SP',
    zip_code: '01302-000',
    notes: 'Equipamentos de segurança e controle de acesso. Equipe treinada e certificada.',
    status: 'active'
  },
  {
    company_name: 'Recepção VIP',
    contact_name: 'Carolina Andrade',
    email: TEST_EMAIL,
    phone: '(11) 3700-8000',
    equipment_types: [
      'Recepção',
      'Check-in',
      'Credenciamento',
      'Balcões de Atendimento',
      'Totems',
      'Impressoras',
      'Leitores de QR Code',
      'Tablets',
      'Crachás',
      'Pastas',
      'Brindes'
    ],
    address: 'Av. Faria Lima, 4000',
    city: 'São Paulo',
    state: 'SP',
    zip_code: '01452-900',
    notes: 'Soluções completas para credenciamento e recepção de eventos.',
    status: 'active'
  }
];

// Dados de projetos
const PROJECTS = [
  {
    project_number: 'SEED-001',
    event_name: 'Conferência Tech 2025',
    event_type: 'corporativo',
    event_date: '2025-11-15',
    start_time: '09:00',
    end_time: '18:00',
    expected_attendance: 500,
    venue_name: 'Centro de Convenções Frei Caneca',
    venue_address: 'Rua Frei Caneca, 569',
    venue_city: 'São Paulo',
    venue_state: 'SP',
    venue_zip: '01307-001',
    client_name: 'Tech Corp LTDA',
    client_email: TEST_EMAIL,
    client_phone: '(11) 95555-0000',
    status: 'new',
    professionals_needed: [
      { category: 'Fotografia', quantity: 2, notes: 'Fotógrafos profissionais' },
      { category: 'Videomaker', quantity: 1, notes: 'Para cobertura do evento' },
      { category: 'Segurança', quantity: 4, notes: 'Controle de acesso' },
      { category: 'Recepção', quantity: 3, notes: 'Recepcionistas bilíngues' }
    ],
    equipment_needed: [
      { category: 'Som', quantity: 1, notes: 'Sistema de som completo para auditório 500 pessoas' },
      { category: 'Iluminação', quantity: 1, notes: 'Iluminação profissional de palco com moving lights' },
      { category: 'Audiovisual', quantity: 2, notes: 'Projetores 4K + telões' },
      { category: 'Projeção', quantity: 1, notes: 'Telas de projeção 3x4m' },
      { category: 'Palco', quantity: 1, notes: 'Palco 8x6m com cobertura' },
      { category: 'Cadeiras', quantity: 500, notes: 'Cadeiras estofadas confortáveis' },
      { category: 'Mesas', quantity: 50, notes: 'Mesas redondas para coffee break' },
      { category: 'Ar Condicionado', quantity: 1, notes: 'Climatização para 500 pessoas' },
      { category: 'Credenciamento', quantity: 1, notes: 'Sistema completo de credenciamento' },
      { category: 'Segurança', quantity: 1, notes: 'Câmeras CFTV + catracas' }
    ]
  },
  {
    project_number: 'SEED-002',
    event_name: 'Casamento Ana & Carlos',
    event_type: 'social',
    event_date: '2025-12-20',
    start_time: '19:00',
    end_time: '02:00',
    expected_attendance: 200,
    venue_name: 'Espaço Jardim das Flores',
    venue_address: 'Av. Europa, 1500',
    venue_city: 'São Paulo',
    venue_state: 'SP',
    venue_zip: '01449-000',
    client_name: 'Ana Silva',
    client_email: TEST_EMAIL,
    client_phone: '(11) 94444-0000',
    status: 'new',
    professionals_needed: [
      { category: 'Fotografia', quantity: 2, notes: 'Fotografia e álbum' },
      { category: 'DJ', quantity: 1, notes: 'DJ para festa' },
      { category: 'Garçom', quantity: 8, notes: 'Equipe de garçons' },
      { category: 'Barman', quantity: 2, notes: 'Bartenders' }
    ],
    equipment_needed: [
      { category: 'Buffet', quantity: 1, notes: 'Buffet completo para 200 pessoas - jantar' },
      { category: 'Gastronomia', quantity: 1, notes: 'Cardápio premium' },
      { category: 'Bar', quantity: 1, notes: 'Bar completo com chopeira' },
      { category: 'Decoração', quantity: 1, notes: 'Decoração tema rústico-chique' },
      { category: 'Flores', quantity: 1, notes: 'Arranjos florais e buquê' },
      { category: 'Mesas', quantity: 25, notes: 'Mesas redondas para 8 pessoas' },
      { category: 'Cadeiras', quantity: 200, notes: 'Cadeiras estofadas com capas' },
      { category: 'Som', quantity: 1, notes: 'Sistema de som para festa + DJ' },
      { category: 'Iluminação', quantity: 1, notes: 'Iluminação decorativa + dança' },
      { category: 'Tendas', quantity: 1, notes: 'Tenda cristal 10x20m' },
      { category: 'Toalhas de Mesa', quantity: 25, notes: 'Toalhas brancas premium' }
    ]
  }
];

async function main() {
  console.log('🌱 Iniciando seed de dados de teste...\n');
  console.log('⚠️  IMPORTANTE: Antes de rodar, execute no Supabase SQL Editor:');
  console.log('   - supabase/migrations/025_supplier_suggestions.sql\n');
  console.log('Pressione Ctrl+C para cancelar ou aguarde 5 segundos para continuar...\n');

  await new Promise(resolve => setTimeout(resolve, 5000));

  try {
    // 1. CRIAR PROFISSIONAIS
    console.log('👷 Criando profissionais...');
    const createdProfessionals = [];

    for (const prof of PROFESSIONALS) {
      const { data, error } = await supabase
        .from('professionals')
        .insert(prof)
        .select()
        .single();

      if (error) {
        console.error(`❌ Erro ao criar ${prof.full_name}:`, error.message);
      } else {
        console.log(`✅ ${prof.full_name} criado`);
        createdProfessionals.push(data);
      }
    }

    // 2. CRIAR FORNECEDORES
    console.log('\n🏭 Criando fornecedores...');
    const createdSuppliers = [];

    for (const supplier of SUPPLIERS) {
      const { data, error } = await supabase
        .from('equipment_suppliers')
        .insert(supplier)
        .select()
        .single();

      if (error) {
        console.error(`❌ Erro ao criar ${supplier.company_name}:`, error.message);
      } else {
        console.log(`✅ ${supplier.company_name} criado`);
        createdSuppliers.push(data);
      }
    }

    // 3. CRIAR PROJETOS
    console.log('\n📋 Criando projetos...');
    const createdProjects = [];

    for (const project of PROJECTS) {
      const { data, error } = await supabase
        .from('event_projects')
        .insert(project)
        .select()
        .single();

      if (error) {
        console.error(`❌ Erro ao criar ${project.event_name}:`, error.message);
      } else {
        console.log(`✅ ${project.event_name} criado`);
        createdProjects.push(data);
      }
    }

    // 4. GEOCODIFICAR TODOS
    console.log('\n🌍 Geocodificando endereços...');
    console.log('(Isso pode levar alguns minutos...)\n');

    // Geocodificar profissionais
    if (createdProfessionals.length > 0) {
      console.log('📍 Geocodificando profissionais...');
      const profIds = createdProfessionals.map(p => p.id);

      const response = await fetch('http://localhost:3000/api/admin/geocode/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'professionals',
          ids: profIds
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ ${result.data?.summary?.successful || 0} profissionais geocodificados`);
      } else {
        console.log('⚠️  Erro ao geocodificar profissionais (execute manualmente na interface)');
      }
    }

    // Geocodificar fornecedores
    if (createdSuppliers.length > 0) {
      console.log('📍 Geocodificando fornecedores...');
      const supplierIds = createdSuppliers.map(s => s.id);

      const response = await fetch('http://localhost:3000/api/admin/geocode/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'suppliers',
          ids: supplierIds
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ ${result.data?.summary?.successful || 0} fornecedores geocodificados`);
      } else {
        console.log('⚠️  Erro ao geocodificar fornecedores (execute manualmente na interface)');
      }
    }

    // Geocodificar eventos
    if (createdProjects.length > 0) {
      console.log('📍 Geocodificando eventos...');
      const projectIds = createdProjects.map(p => p.id);

      const response = await fetch('http://localhost:3000/api/admin/geocode/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'events',
          ids: projectIds
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ ${result.data?.summary?.successful || 0} eventos geocodificados`);
      } else {
        console.log('⚠️  Erro ao geocodificar eventos (execute manualmente na interface)');
      }
    }

    // RESUMO
    console.log('\n✨ SEED COMPLETO!\n');
    console.log('📊 Resumo:');
    console.log(`   - ${createdProfessionals.length} profissionais criados`);
    console.log(`   - ${createdSuppliers.length} fornecedores criados`);
    console.log(`   - ${createdProjects.length} projetos criados`);
    console.log(`   - Email de teste: ${TEST_EMAIL}`);
    console.log(`   - Localização: São Paulo, SP\n`);
    console.log('🎯 Próximos passos:');
    console.log('   1. Acesse /admin/projetos');
    console.log('   2. Clique em SEED-001 ou SEED-002');
    console.log('   3. Vá na aba "Equipe" para ver as sugestões');
    console.log('   4. Adicione profissionais e envie convites');
    console.log('   5. Vá na aba "Equipamentos" para solicitar cotações\n');

  } catch (error) {
    console.error('\n❌ Erro geral:', error);
    process.exit(1);
  }
}

main();
