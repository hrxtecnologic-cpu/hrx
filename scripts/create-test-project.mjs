import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('='.repeat(70));
console.log('🧪 CRIANDO PROJETO DE TESTE COM VALORES REAIS');
console.log('='.repeat(70));

async function criarProjetoTeste() {
  // 1. Criar projeto de teste
  console.log('\n📋 [1/4] Criando projeto de teste...');

  const { data: projeto, error: projectError } = await supabase
    .from('event_projects')
    .insert({
      client_name: 'Teste - Cliente ABC',
      client_email: 'teste@exemplo.com',
      client_phone: '(21) 99999-9999',
      event_name: 'Teste - Feira de Tecnologia 2025',
      event_type: 'Feira',
      event_date: '2025-12-15',
      venue_name: 'Centro de Convenções',
      venue_address: 'Av. Atlântica, 1000',
      venue_city: 'Rio de Janeiro',
      venue_state: 'RJ',
      status: 'new',
      profit_margin: 35,
      is_urgent: false
    })
    .select()
    .single();

  if (projectError) {
    console.error('❌ Erro ao criar projeto:', projectError.message);
    return;
  }

  console.log(`✅ Projeto criado: ${projeto.project_number}`);
  console.log(`   ID: ${projeto.id}\n`);

  // 2. Adicionar membros à equipe COM VALORES
  console.log('👥 [2/4] Adicionando membros à equipe...');

  const membros = [
    {
      project_id: projeto.id,
      role: 'Eletricista Sênior',
      category: 'Técnica',
      subcategory: 'Elétrica',
      quantity: 2,
      duration_days: 3,
      daily_rate: 350.00,
      notes: 'Profissional com NR10',
      status: 'planned'
    },
    {
      project_id: projeto.id,
      role: 'Segurança',
      category: 'Segurança',
      quantity: 5,
      duration_days: 2,
      daily_rate: 200.00,
      notes: 'Segurança patrimonial',
      status: 'planned'
    },
    {
      project_id: projeto.id,
      role: 'Coordenador de Produção',
      category: 'Produção',
      quantity: 1,
      duration_days: 5,
      daily_rate: 800.00,
      external_name: 'João Silva (Externo)',
      notes: 'Coordenador experiente',
      status: 'planned'
    }
  ];

  for (const membro of membros) {
    const { data, error } = await supabase
      .from('project_team')
      .insert(membro)
      .select()
      .single();

    if (error) {
      console.error(`❌ Erro ao adicionar ${membro.role}:`, error.message);
    } else {
      const expectedCost = membro.daily_rate * membro.quantity * membro.duration_days;
      console.log(`✅ Adicionado: ${membro.role}`);
      console.log(`   Diária: R$ ${membro.daily_rate} × ${membro.quantity} pessoas × ${membro.duration_days} dias`);
      console.log(`   Custo esperado: R$ ${expectedCost.toFixed(2)}`);
      console.log(`   Custo calculado: R$ ${(data.total_cost || 0).toFixed(2)}`);

      if (Math.abs((data.total_cost || 0) - expectedCost) < 0.01) {
        console.log(`   ✅ Trigger funcionou!\n`);
      } else {
        console.log(`   ❌ Trigger NÃO funcionou - total_cost deveria ser R$ ${expectedCost.toFixed(2)}\n`);
      }
    }
  }

  // 3. Buscar totais do projeto
  console.log('💰 [3/4] Verificando totais do projeto...');

  const { data: projetoAtualizado, error: fetchError } = await supabase
    .from('event_projects')
    .select('*')
    .eq('id', projeto.id)
    .single();

  if (fetchError) {
    console.error('❌ Erro ao buscar projeto:', fetchError.message);
    return;
  }

  console.log(`\n📊 VALORES DO PROJETO:`);
  console.log(`   total_team_cost: R$ ${(projetoAtualizado.total_team_cost || 0).toFixed(2)}`);
  console.log(`   total_equipment_cost: R$ ${(projetoAtualizado.total_equipment_cost || 0).toFixed(2)}`);
  console.log(`   total_cost: R$ ${(projetoAtualizado.total_cost || 0).toFixed(2)}`);
  console.log(`   profit_margin: ${projetoAtualizado.profit_margin}%`);
  console.log(`   total_client_price: R$ ${(projetoAtualizado.total_client_price || 0).toFixed(2)}`);
  console.log(`   total_profit: R$ ${(projetoAtualizado.total_profit || 0).toFixed(2)}`);

  // Calcular esperados
  const expectedTeamCost = (350 * 2 * 3) + (200 * 5 * 2) + (800 * 1 * 5);
  const expectedTotalCost = expectedTeamCost;
  const expectedClientPrice = expectedTotalCost * 1.35; // 35% margem
  const expectedProfit = expectedClientPrice - expectedTotalCost;

  console.log(`\n🎯 VALORES ESPERADOS:`);
  console.log(`   total_team_cost: R$ ${expectedTeamCost.toFixed(2)}`);
  console.log(`   total_cost: R$ ${expectedTotalCost.toFixed(2)}`);
  console.log(`   total_client_price: R$ ${expectedClientPrice.toFixed(2)}`);
  console.log(`   total_profit: R$ ${expectedProfit.toFixed(2)}`);

  console.log(`\n✅ [4/4] RESULTADO:`);

  if (Math.abs((projetoAtualizado.total_team_cost || 0) - expectedTeamCost) < 0.01) {
    console.log(`   ✅ total_team_cost CORRETO - Trigger funcionando!`);
  } else {
    console.log(`   ❌ total_team_cost INCORRETO - Migration 016 NÃO foi executada`);
  }

  if (Math.abs((projetoAtualizado.total_cost || 0) - expectedTotalCost) < 0.01) {
    console.log(`   ✅ total_cost CORRETO - Trigger funcionando!`);
  } else {
    console.log(`   ❌ total_cost INCORRETO - Migration 016 NÃO foi executada`);
  }

  console.log('\n' + '='.repeat(70));
  console.log(`\n📋 Projeto criado: ${projeto.project_number} (ID: ${projeto.id})`);
  console.log(`   Acesse: http://localhost:3001/admin/projetos/${projeto.id}`);
  console.log('');
}

criarProjetoTeste().catch(console.error);
