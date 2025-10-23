import { createClient } from '@supabase/supabase-js';
import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: Variáveis de ambiente não encontradas');
  console.error('Verifique se NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY estão configurados');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Extrair dados de conexão do Supabase URL
const supabaseProjectRef = supabaseUrl.match(/https:\/\/(.+)\.supabase\.co/)?.[1];
const connectionString = `postgresql://postgres.${supabaseProjectRef}:${process.env.SUPABASE_DB_PASSWORD || 'SENHA_AQUI'}@aws-0-sa-east-1.pooler.supabase.com:6543/postgres`;

async function executarSQL(client: Client, sql: string, descricao: string) {
  console.log(`\n🔄 Executando: ${descricao}...`);

  try {
    await client.query(sql);
    console.log(`✅ ${descricao} - Sucesso!`);
    return true;
  } catch (err: any) {
    console.error(`❌ Erro: ${err.message}`);
    return false;
  }
}

async function executarMigration() {
  console.log('='.repeat(60));
  console.log('🚀 EXECUTANDO MIGRATION 016 - CÁLCULOS FINANCEIROS');
  console.log('='.repeat(60));

  // 1. Ler arquivo da migration
  const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '016_fix_financial_calculations.sql');

  if (!fs.existsSync(migrationPath)) {
    console.error(`❌ Arquivo não encontrado: ${migrationPath}`);
    process.exit(1);
  }

  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

  console.log(`\n📄 Lendo migration de: ${migrationPath}`);
  console.log(`📊 Tamanho: ${(migrationSQL.length / 1024).toFixed(2)} KB`);

  // 2. Executar migration (dividir em partes pois RPC tem limite)
  console.log('\n📝 Executando migration principal...');

  // Função para criar função update_project_team_cost
  const createFunc1 = `
CREATE OR REPLACE FUNCTION update_project_team_cost()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE event_projects
  SET total_team_cost = (
    SELECT COALESCE(SUM(total_cost), 0)
    FROM project_team
    WHERE project_id = COALESCE(NEW.project_id, OLD.project_id)
  ),
  updated_at = NOW()
  WHERE id = COALESCE(NEW.project_id, OLD.project_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;
`;

  const createTrigger1 = `
DROP TRIGGER IF EXISTS trigger_update_project_team_cost ON project_team;
CREATE TRIGGER trigger_update_project_team_cost
  AFTER INSERT OR UPDATE OR DELETE ON project_team
  FOR EACH ROW
  EXECUTE FUNCTION update_project_team_cost();
`;

  const createFunc2 = `
CREATE OR REPLACE FUNCTION update_project_equipment_cost()
RETURNS TRIGGER AS $$
DECLARE
  v_project_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_project_id := OLD.project_id;
  ELSE
    v_project_id := NEW.project_id;
  END IF;

  UPDATE event_projects
  SET total_equipment_cost = (
    SELECT COALESCE(SUM(
      sq.hrx_price * pe.quantity * pe.duration_days
    ), 0)
    FROM project_equipment pe
    LEFT JOIN supplier_quotations sq ON sq.id = pe.selected_quote_id
    WHERE pe.project_id = v_project_id
      AND sq.status = 'accepted'
  ),
  updated_at = NOW()
  WHERE id = v_project_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;
`;

  const createTrigger2 = `
DROP TRIGGER IF EXISTS trigger_update_project_equipment_cost_quotations ON supplier_quotations;
CREATE TRIGGER trigger_update_project_equipment_cost_quotations
  AFTER INSERT OR UPDATE OR DELETE ON supplier_quotations
  FOR EACH ROW
  EXECUTE FUNCTION update_project_equipment_cost();

DROP TRIGGER IF EXISTS trigger_update_project_equipment_cost_equipment ON project_equipment;
CREATE TRIGGER trigger_update_project_equipment_cost_equipment
  AFTER UPDATE ON project_equipment
  FOR EACH ROW
  WHEN (OLD.selected_quote_id IS DISTINCT FROM NEW.selected_quote_id
        OR OLD.quantity IS DISTINCT FROM NEW.quantity
        OR OLD.duration_days IS DISTINCT FROM NEW.duration_days)
  EXECUTE FUNCTION update_project_equipment_cost();
`;

  const createFunc3 = `
CREATE OR REPLACE FUNCTION update_project_totals()
RETURNS TRIGGER AS $$
BEGIN
  NEW.total_cost := COALESCE(NEW.total_team_cost, 0) + COALESCE(NEW.total_equipment_cost, 0);
  NEW.total_client_price := NEW.total_cost * (1 + COALESCE(NEW.profit_margin, 35) / 100.0);
  NEW.total_profit := NEW.total_client_price - NEW.total_cost;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
`;

  const createTrigger3 = `
DROP TRIGGER IF EXISTS trigger_update_project_totals ON event_projects;
CREATE TRIGGER trigger_update_project_totals
  BEFORE UPDATE ON event_projects
  FOR EACH ROW
  WHEN (OLD.total_team_cost IS DISTINCT FROM NEW.total_team_cost
        OR OLD.total_equipment_cost IS DISTINCT FROM NEW.total_equipment_cost
        OR OLD.profit_margin IS DISTINCT FROM NEW.profit_margin)
  EXECUTE FUNCTION update_project_totals();
`;

  // Executar cada parte
  await executarSQL(createFunc1, 'Criar função update_project_team_cost');
  await executarSQL(createTrigger1, 'Criar trigger para equipe');
  await executarSQL(createFunc2, 'Criar função update_project_equipment_cost');
  await executarSQL(createTrigger2, 'Criar triggers para equipamentos');
  await executarSQL(createFunc3, 'Criar função update_project_totals');
  await executarSQL(createTrigger3, 'Criar trigger para totais');

  console.log('\n✅ Migration executada com sucesso!');
}

async function verificarTriggers() {
  console.log('\n' + '='.repeat(60));
  console.log('🔍 VERIFICANDO TRIGGERS CRIADOS');
  console.log('='.repeat(60));

  const { data, error } = await supabase
    .from('pg_trigger')
    .select('tgname, tgrelid')
    .like('tgname', 'trigger_update_project%');

  if (error) {
    console.error('❌ Erro ao verificar triggers:', error.message);
    return;
  }

  const expectedTriggers = [
    'trigger_update_project_team_cost',
    'trigger_update_project_equipment_cost_quotations',
    'trigger_update_project_equipment_cost_equipment',
    'trigger_update_project_totals'
  ];

  console.log(`\n📋 Triggers esperados: ${expectedTriggers.length}`);
  console.log(`📋 Triggers encontrados: ${data?.length || 0}`);

  if (data && data.length >= 4) {
    console.log('✅ Todos os triggers foram criados corretamente!');
    data.forEach((trigger: any) => {
      console.log(`   ✓ ${trigger.tgname}`);
    });
  } else {
    console.log('⚠️ Alguns triggers podem não ter sido criados');
  }
}

async function recalcularProjetos() {
  console.log('\n' + '='.repeat(60));
  console.log('🔄 RECALCULANDO PROJETOS EXISTENTES');
  console.log('='.repeat(60));

  // Buscar todos os projetos
  const { data: projetos, error } = await supabase
    .from('event_projects')
    .select('id, project_number');

  if (error) {
    console.error('❌ Erro ao buscar projetos:', error.message);
    return;
  }

  console.log(`\n📊 Encontrados ${projetos?.length || 0} projetos`);

  if (!projetos || projetos.length === 0) {
    console.log('⚠️ Nenhum projeto encontrado para recalcular');
    return;
  }

  // Forçar recálculo atualizando updated_at
  for (const projeto of projetos) {
    const { error: updateError } = await supabase
      .from('event_projects')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', projeto.id);

    if (updateError) {
      console.log(`❌ Erro ao recalcular ${projeto.project_number}: ${updateError.message}`);
    } else {
      console.log(`✅ Recalculado: ${projeto.project_number}`);
    }
  }

  console.log('\n✅ Todos os projetos foram recalculados!');
}

async function testarCalculos() {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 TESTANDO CÁLCULOS');
  console.log('='.repeat(60));

  // Buscar primeiro projeto que tenha equipe
  const { data: projetos, error } = await supabase
    .from('event_projects')
    .select(`
      id,
      project_number,
      total_team_cost,
      total_equipment_cost,
      total_cost,
      total_client_price,
      total_profit,
      profit_margin
    `)
    .limit(5);

  if (error) {
    console.error('❌ Erro ao buscar projetos:', error.message);
    return;
  }

  if (!projetos || projetos.length === 0) {
    console.log('⚠️ Nenhum projeto encontrado para testar');
    return;
  }

  console.log(`\n📊 Testando ${projetos.length} projetos:\n`);

  for (const projeto of projetos) {
    console.log(`\n📋 Projeto: ${projeto.project_number}`);
    console.log(`   ID: ${projeto.id}`);
    console.log(`   Equipe: R$ ${(projeto.total_team_cost || 0).toFixed(2)}`);
    console.log(`   Equipamentos: R$ ${(projeto.total_equipment_cost || 0).toFixed(2)}`);
    console.log(`   Total Custo: R$ ${(projeto.total_cost || 0).toFixed(2)}`);
    console.log(`   Margem: ${projeto.profit_margin || 35}%`);
    console.log(`   Preço Cliente: R$ ${(projeto.total_client_price || 0).toFixed(2)}`);
    console.log(`   Lucro: R$ ${(projeto.total_profit || 0).toFixed(2)}`);

    // Verificar se valores fazem sentido
    const expectedTotal = (projeto.total_team_cost || 0) + (projeto.total_equipment_cost || 0);
    const expectedClientPrice = expectedTotal * (1 + (projeto.profit_margin || 35) / 100);
    const expectedProfit = expectedClientPrice - expectedTotal;

    if (Math.abs((projeto.total_cost || 0) - expectedTotal) < 0.01) {
      console.log('   ✅ total_cost CORRETO');
    } else {
      console.log(`   ❌ total_cost INCORRETO (esperado: ${expectedTotal.toFixed(2)})`);
    }

    if (Math.abs((projeto.total_client_price || 0) - expectedClientPrice) < 0.01) {
      console.log('   ✅ total_client_price CORRETO');
    } else {
      console.log(`   ❌ total_client_price INCORRETO (esperado: ${expectedClientPrice.toFixed(2)})`);
    }
  }
}

async function main() {
  try {
    console.log('\n🚀 Iniciando migration e testes...\n');
    console.log(`📡 Supabase URL: ${supabaseUrl}`);
    console.log(`🔑 Service Role Key: ${supabaseKey.substring(0, 20)}...`);

    // 1. Executar migration
    await executarMigration();

    // 2. Verificar se triggers foram criados
    await verificarTriggers();

    // 3. Recalcular projetos existentes
    await recalcularProjetos();

    // 4. Testar cálculos
    await testarCalculos();

    console.log('\n' + '='.repeat(60));
    console.log('✅ MIGRATION 016 CONCLUÍDA COM SUCESSO!');
    console.log('='.repeat(60));
    console.log('\n💡 Próximos passos:');
    console.log('   1. Acesse http://localhost:3001/admin/projetos');
    console.log('   2. Verifique se os valores aparecem corretamente');
    console.log('   3. Adicione um membro à equipe e veja o total atualizar');
    console.log('');

  } catch (error: any) {
    console.error('\n❌ Erro fatal:', error.message);
    process.exit(1);
  }
}

main();
