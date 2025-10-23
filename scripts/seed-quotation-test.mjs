#!/usr/bin/env node

/**
 * Script de Seed para Teste Completo do Sistema de Orçamentos
 *
 * Cria:
 * 1. Fornecedores de teste
 * 2. Projeto de teste
 * 3. Equipamentos no projeto
 * 4. Solicitações de orçamento
 * 5. Respostas simuladas dos fornecedores
 */

import { createClient } from '@supabase/supabase-js';
import { nanoid } from 'nanoid';

const SUPABASE_URL = 'https://waplbfawlcavwtvfwprf.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhcGxiZmF3bGNhdnd0dmZ3cHJmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDg4MDE2MSwiZXhwIjoyMDc2NDU2MTYxfQ.4f_wtj8epcr-39D3LX71Tw4TmalNRVJQPMxdOL689Yk';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('🚀 Iniciando seed do sistema de orçamentos...\n');

// 1. Criar Fornecedores
console.log('📦 Criando fornecedores de teste...');

const suppliers = [
  {
    company_name: 'Som & Luz Premium',
    contact_name: 'João Silva',
    email: 'joao@someluzeventos.com',
    phone: '(11) 98765-4321',
    equipment_types: ['Sistema de Som Completo', 'Caixas de Som', 'Microfones'],
    status: 'active',
    pricing: {
      daily: 'R$ 500,00',
      three_days: 'R$ 1.200,00',
      weekly: 'R$ 2.000,00'
    }
  },
  {
    company_name: 'Audiovisual Pro',
    contact_name: 'Maria Santos',
    email: 'maria@audiovisualpro.com',
    phone: '(11) 99876-5432',
    equipment_types: ['Sistema de Som Completo', 'Telão LED', 'Projetor'],
    status: 'active',
    pricing: {
      daily: 'R$ 450,00',
      three_days: 'R$ 1.100,00',
      weekly: 'R$ 1.800,00'
    }
  },
  {
    company_name: 'Studio Sound',
    contact_name: 'Carlos Oliveira',
    email: 'carlos@studiosound.com',
    phone: '(11) 97654-3210',
    equipment_types: ['Sistema de Som Completo', 'Mesa de Som', 'Amplificadores'],
    status: 'active',
    pricing: {
      daily: 'R$ 550,00',
      three_days: 'R$ 1.400,00',
      weekly: 'R$ 2.200,00'
    }
  }
];

const { data: createdSuppliers, error: supplierError } = await supabase
  .from('equipment_suppliers')
  .insert(suppliers)
  .select();

if (supplierError) {
  console.error('❌ Erro ao criar fornecedores:', supplierError);
  process.exit(1);
}

console.log(`✅ ${createdSuppliers.length} fornecedores criados!\n`);

// 2. Criar Projeto de Teste
console.log('🎪 Criando projeto de teste...');

const { data: project, error: projectError } = await supabase
  .from('event_projects')
  .insert({
    client_name: 'Empresa XYZ Ltda',
    client_email: 'contato@empresaxyz.com',
    client_phone: '(11) 3333-4444',
    client_company: 'Empresa XYZ',
    event_name: 'Festa de Confraternização 2025',
    event_type: 'Corporativo',
    event_description: 'Evento de fim de ano da empresa com 200 colaboradores',
    event_date: '2025-12-15',
    start_time: '19:00',
    end_time: '23:00',
    expected_attendance: 200,
    venue_name: 'Espaço Premium Eventos',
    venue_address: 'Rua das Flores, 123',
    venue_city: 'São Paulo',
    venue_state: 'SP',
    venue_zip: '01234-567',
    is_urgent: false,
    profit_margin: 35,
    status: 'new',
    total_team_cost: 5000,
    total_equipment_cost: 0,
    total_cost: 5000,
    total_client_price: 6750
  })
  .select()
  .single();

if (projectError) {
  console.error('❌ Erro ao criar projeto:', projectError);
  process.exit(1);
}

console.log(`✅ Projeto criado: ${project.project_number}\n`);

// 3. Adicionar Equipamentos ao Projeto
console.log('🎵 Adicionando equipamentos ao projeto...');

const equipment = [
  {
    project_id: project.id,
    equipment_type: 'owned',
    category: 'Som e Áudio',
    subcategory: 'Amplificação',
    name: 'Sistema de Som Completo',
    description: 'Sistema de som profissional para 200 pessoas',
    quantity: 1,
    duration_days: 1,
    specifications: { potencia: '2000W', tipo: 'Line Array' },
    status: 'requested'
  },
  {
    project_id: project.id,
    equipment_type: 'owned',
    category: 'Iluminação',
    subcategory: 'Iluminação Cênica',
    name: 'Moving Heads',
    description: 'Moving heads para iluminação dinâmica',
    quantity: 4,
    duration_days: 1,
    specifications: { tipo: 'LED', cores: 'RGB' },
    status: 'requested'
  }
];

const { data: createdEquipment, error: equipmentError } = await supabase
  .from('project_equipment')
  .insert(equipment)
  .select();

if (equipmentError) {
  console.error('❌ Erro ao criar equipamentos:', equipmentError);
  process.exit(1);
}

console.log(`✅ ${createdEquipment.length} equipamentos adicionados!\n`);

// 4. Criar Solicitações de Orçamento
console.log('💰 Criando solicitações de orçamento...');

const validUntil = new Date();
validUntil.setDate(validUntil.getDate() + 7);

const quotationRequests = createdSuppliers.map(supplier => ({
  project_id: project.id,
  supplier_id: supplier.id,
  token: nanoid(32),
  requested_items: equipment.map(eq => ({
    name: eq.name,
    category: eq.category,
    quantity: eq.quantity,
    duration_days: eq.duration_days,
    specifications: eq.description
  })),
  status: 'pending',
  valid_until: validUntil.toISOString()
}));

const { data: createdQuotations, error: quotationError } = await supabase
  .from('supplier_quotations')
  .insert(quotationRequests)
  .select();

if (quotationError) {
  console.error('❌ Erro ao criar solicitações:', quotationError);
  process.exit(1);
}

console.log(`✅ ${createdQuotations.length} solicitações criadas!\n`);

// 5. Simular Respostas dos Fornecedores
console.log('📝 Simulando respostas de fornecedores...\n');

const responses = [
  {
    id: createdQuotations[0].id,
    total_price: 4500,
    daily_rate: 450,
    delivery_fee: 200,
    setup_fee: 300,
    payment_terms: '50% antecipado, 50% após o evento',
    delivery_details: 'Entrega e montagem inclusas. Chegada 2h antes do evento.',
    notes: 'Equipe técnica inclusa para operação durante o evento'
  },
  {
    id: createdQuotations[1].id,
    total_price: 5200,
    daily_rate: 500,
    delivery_fee: 250,
    setup_fee: 400,
    payment_terms: 'Pagamento à vista com 5% de desconto',
    delivery_details: 'Entrega no dia anterior. Montagem 3h antes.',
    notes: 'Backup de equipamento disponível'
  },
  {
    id: createdQuotations[2].id,
    total_price: 4800,
    daily_rate: 480,
    delivery_fee: 220,
    setup_fee: 350,
    payment_terms: '30% antecipado, saldo em 30 dias',
    delivery_details: 'Entrega e desmontagem inclusas',
    notes: 'Garantia de 12 meses em todos equipamentos'
  }
];

for (const response of responses) {
  const { error: updateError } = await supabase
    .from('supplier_quotations')
    .update({
      ...response,
      status: 'submitted',
      submitted_at: new Date().toISOString(),
      responded_at: new Date().toISOString()
    })
    .eq('id', response.id);

  if (updateError) {
    console.error(`❌ Erro ao atualizar orçamento ${response.id}:`, updateError);
  } else {
    console.log(`✅ Orçamento de ${createdSuppliers.find(s => s.id === createdQuotations.find(q => q.id === response.id)?.supplier_id)?.company_name} respondido`);
  }
}

console.log('\n🎉 SEED COMPLETO!\n');
console.log('📊 DADOS CRIADOS:');
console.log(`   - Fornecedores: ${createdSuppliers.length}`);
console.log(`   - Projeto: ${project.project_number}`);
console.log(`   - Equipamentos: ${createdEquipment.length}`);
console.log(`   - Orçamentos solicitados: ${createdQuotations.length}`);
console.log(`   - Orçamentos respondidos: ${responses.length}\n`);

console.log('🔗 ACESSE O ADMIN:');
console.log(`   http://localhost:3001/admin/projetos/${project.id}\n`);

console.log('📋 TOKENS GERADOS (para teste manual):');
createdQuotations.forEach((q, i) => {
  console.log(`   Fornecedor ${i + 1}: http://localhost:3001/orcamento/${q.token}`);
});

console.log('\n✅ Tudo pronto para testar!');
