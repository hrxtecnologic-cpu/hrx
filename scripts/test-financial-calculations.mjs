import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar .env.local
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Credenciais do Supabase não encontradas no .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('='.repeat(70));
console.log('🧪 TESTANDO CÁLCULOS FINANCEIROS DOS PROJETOS');
console.log('='.repeat(70));
console.log(`📡 Conectado: ${supabaseUrl}\n`);

async function testarCalculos() {
  // 1. Buscar projetos
  const { data: projetos, error: projetosError } = await supabase
    .from('event_projects')
    .select('*')
    .limit(5);

  if (projetosError) {
    console.error('❌ Erro ao buscar projetos:', projetosError.message);
    return;
  }

  if (!projetos || projetos.length === 0) {
    console.log('⚠️ Nenhum projeto encontrado no banco de dados');
    return;
  }

  console.log(`📊 Encontrados ${projetos.length} projetos\n`);

  for (const projeto of projetos) {
    console.log('─'.repeat(70));
    console.log(`\n📋 Projeto: ${projeto.project_number}`);
    console.log(`   Cliente: ${projeto.client_name || 'N/A'}`);
    console.log(`   Status: ${projeto.status}`);
    console.log(`   ID: ${projeto.id}\n`);

    // 2. Buscar equipe do projeto
    const { data: equipe, error: equipeError } = await supabase
      .from('project_team')
      .select('*, professional:professionals(full_name)')
      .eq('project_id', projeto.id);

    let teamTotal = 0;
    if (equipe && equipe.length > 0) {
      console.log(`   👥 EQUIPE (${equipe.length} membros):`);
      equipe.forEach((membro, idx) => {
        const nome = membro.professional?.full_name || membro.external_name || 'Sem nome';
        const custo = membro.total_cost || 0;
        teamTotal += custo;
        console.log(`      ${idx + 1}. ${nome} - R$ ${custo.toFixed(2)}`);
      });
      console.log(`      💰 Total Equipe (calculado): R$ ${teamTotal.toFixed(2)}`);
    } else {
      console.log(`   👥 EQUIPE: Nenhum membro`);
    }

    // 3. Buscar equipamentos do projeto
    const { data: equipamentos, error: equipError } = await supabase
      .from('project_equipment')
      .select(`
        *,
        selected_quotation:supplier_quotations!project_equipment_selected_quote_id_fkey(
          hrx_price,
          status
        )
      `)
      .eq('project_id', projeto.id);

    let equipmentTotal = 0;
    if (equipamentos && equipamentos.length > 0) {
      console.log(`\n   📦 EQUIPAMENTOS (${equipamentos.length} itens):`);
      equipamentos.forEach((eq, idx) => {
        const quotation = eq.selected_quotation;
        if (quotation && quotation.status === 'accepted') {
          const custo = quotation.hrx_price * eq.quantity * eq.duration_days;
          equipmentTotal += custo;
          console.log(`      ${idx + 1}. ${eq.name} - R$ ${custo.toFixed(2)} (${eq.quantity}x ${eq.duration_days}d @ R$${quotation.hrx_price})`);
        } else {
          console.log(`      ${idx + 1}. ${eq.name} - Sem cotação aceita`);
        }
      });
      console.log(`      💰 Total Equipamentos (calculado): R$ ${equipmentTotal.toFixed(2)}`);
    } else {
      console.log(`\n   📦 EQUIPAMENTOS: Nenhum item`);
    }

    // 4. Valores armazenados no projeto
    console.log(`\n   💵 VALORES NO BANCO (event_projects):`);
    console.log(`      total_team_cost: R$ ${(projeto.total_team_cost || 0).toFixed(2)}`);
    console.log(`      total_equipment_cost: R$ ${(projeto.total_equipment_cost || 0).toFixed(2)}`);
    console.log(`      total_cost: R$ ${(projeto.total_cost || 0).toFixed(2)}`);
    console.log(`      profit_margin: ${projeto.profit_margin || 35}%`);
    console.log(`      total_client_price: R$ ${(projeto.total_client_price || 0).toFixed(2)}`);
    console.log(`      total_profit: R$ ${(projeto.total_profit || 0).toFixed(2)}`);

    // 5. Verificação
    const expectedTeamCost = teamTotal;
    const expectedEquipmentCost = equipmentTotal;
    const expectedTotalCost = teamTotal + equipmentTotal;
    const expectedClientPrice = expectedTotalCost * (1 + (projeto.profit_margin || 35) / 100);
    const expectedProfit = expectedClientPrice - expectedTotalCost;

    console.log(`\n   ✅ VERIFICAÇÃO:`);

    const tolerance = 0.01;

    if (Math.abs((projeto.total_team_cost || 0) - expectedTeamCost) < tolerance) {
      console.log(`      ✅ total_team_cost CORRETO`);
    } else {
      console.log(`      ❌ total_team_cost INCORRETO (esperado: R$ ${expectedTeamCost.toFixed(2)}, obtido: R$ ${(projeto.total_team_cost || 0).toFixed(2)})`);
    }

    if (Math.abs((projeto.total_equipment_cost || 0) - expectedEquipmentCost) < tolerance) {
      console.log(`      ✅ total_equipment_cost CORRETO`);
    } else {
      console.log(`      ❌ total_equipment_cost INCORRETO (esperado: R$ ${expectedEquipmentCost.toFixed(2)}, obtido: R$ ${(projeto.total_equipment_cost || 0).toFixed(2)})`);
    }

    if (Math.abs((projeto.total_cost || 0) - expectedTotalCost) < tolerance) {
      console.log(`      ✅ total_cost CORRETO`);
    } else {
      console.log(`      ❌ total_cost INCORRETO (esperado: R$ ${expectedTotalCost.toFixed(2)}, obtido: R$ ${(projeto.total_cost || 0).toFixed(2)})`);
    }

    if (Math.abs((projeto.total_client_price || 0) - expectedClientPrice) < tolerance) {
      console.log(`      ✅ total_client_price CORRETO`);
    } else {
      console.log(`      ❌ total_client_price INCORRETO (esperado: R$ ${expectedClientPrice.toFixed(2)}, obtido: R$ ${(projeto.total_client_price || 0).toFixed(2)})`);
    }

    console.log('');
  }

  console.log('='.repeat(70));
  console.log('✅ TESTE CONCLUÍDO');
  console.log('='.repeat(70));
  console.log('\n💡 Próximos passos:');
  console.log('   1. Se os valores estão INCORRETOS: Execute a migration 016');
  console.log('   2. Copie o conteúdo de: supabase/migrations/016_fix_financial_calculations.sql');
  console.log('   3. Acesse: https://supabase.com/dashboard (SQL Editor)');
  console.log('   4. Cole e execute o SQL');
  console.log('   5. Execute este script novamente para verificar\n');
}

testarCalculos().catch(console.error);
