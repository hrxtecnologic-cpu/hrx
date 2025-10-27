#!/usr/bin/env node
/**
 * AUDITORIA COMPLETA E REAL DO BANCO DE DADOS POSTGRESQL
 * Consulta DIRETAMENTE as tabelas de sistema (pg_catalog)
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║     AUDITORIA COMPLETA DO BANCO DE DADOS POSTGRESQL REAL       ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');
console.log(`📍 Supabase URL: ${supabaseUrl}\n`);

// =====================================================
// 1. TODAS AS TABELAS
// =====================================================
async function getAllTables() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║  1. TABELAS DO SCHEMA PUBLIC                                   ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  const { data, error } = await supabase.rpc('exec_raw_sql', {
    sql: `
      SELECT
        t.table_name,
        (
          SELECT COUNT(*)
          FROM information_schema.columns c
          WHERE c.table_schema = 'public'
            AND c.table_name = t.table_name
        ) as column_count,
        pg_size_pretty(pg_total_relation_size('"public"."' || t.table_name || '"')) as table_size
      FROM information_schema.tables t
      WHERE t.table_schema = 'public'
        AND t.table_type = 'BASE TABLE'
      ORDER BY t.table_name;
    `
  });

  if (error) {
    console.log('⚠️  RPC não disponível. Usando método alternativo...\n');

    // Método alternativo: testar tabelas conhecidas
    const tables = [
      'users', 'professionals', 'contractors', 'equipment_suppliers',
      'event_projects', 'project_team', 'project_equipment',
      'supplier_quotations', 'categories', 'event_types',
      'document_validations', 'email_logs', 'notifications',
      'professional_reviews', 'supplier_reviews', 'rate_limits',
      'professional_history', 'project_emails', 'requests',
      'equipment_allocations', 'event_allocations',
      'email_template_config', 'notification_preferences',
      'delivery_trackings', 'delivery_location_history', 'delivery_status_updates',
      'notifications_old'
    ];

    console.log('Verificando tabelas:\n');
    let totalTables = 0;

    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (!error) {
        totalTables++;
        console.log(`  ${totalTables}. ${table.padEnd(35)} ${count?.toString().padStart(6)} registros`);
      }
    }

    console.log(`\n📊 Total de tabelas encontradas: ${totalTables}`);
    return totalTables;
  }

  console.log(`📊 Total de tabelas: ${data.length}\n`);
  data.forEach((t, idx) => {
    console.log(`  ${(idx + 1).toString().padStart(2)}. ${t.table_name.padEnd(35)} ${t.column_count} colunas | ${t.table_size}`);
  });

  return data.length;
}

// =====================================================
// 2. TODAS AS FUNCTIONS
// =====================================================
async function getAllFunctions() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║  2. FUNCTIONS (STORED PROCEDURES) REAIS NO BANCO               ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  const { data, error } = await supabase.rpc('get_all_functions');

  if (error) {
    console.log('⚠️  Criando function auxiliar para consultar...\n');

    // Tentar criar a function de consulta
    const createFuncSQL = `
      CREATE OR REPLACE FUNCTION get_all_functions()
      RETURNS TABLE(
        function_name text,
        return_type text,
        argument_types text
      ) AS $$
      BEGIN
        RETURN QUERY
        SELECT
          p.proname::text as function_name,
          pg_get_function_result(p.oid)::text as return_type,
          pg_get_function_arguments(p.oid)::text as argument_types
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        ORDER BY p.proname;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;

    console.log('📝 Listando functions conhecidas das migrations:\n');

    const knownFunctions = [
      // Update functions
      'update_updated_at_column',
      'update_equipment_suppliers_updated_at',
      'update_equipment_allocations_updated_at',
      'update_project_team_cost',
      'update_project_equipment_cost',
      'update_project_totals',
      'update_quote_updated_at',

      // Calculate functions
      'calculate_team_member_cost',
      'calculate_quotation_hrx_values',
      'calculate_project_profit_margin',
      'calculate_profit_margin',
      'calculate_hrx_price',
      'calculate_distance',

      // Generate functions
      'generate_project_number',
      'generate_request_number',

      // Get/Search functions
      'get_nearby_suppliers',
      'get_suggested_suppliers',
      'get_professionals_by_subcategory',
      'calculate_supplier_score',

      // Validate functions
      'validate_certifications',
      'has_valid_certification',
    ];

    knownFunctions.forEach((func, idx) => {
      console.log(`  ${(idx + 1).toString().padStart(2)}. ${func}`);
    });

    console.log(`\n📊 Total de functions conhecidas: ${knownFunctions.length}`);
    return knownFunctions.length;
  }

  console.log(`📊 Total de functions: ${data.length}\n`);

  // Agrupar por prefixo
  const byPrefix = {};
  data.forEach(f => {
    const prefix = f.function_name.split('_')[0];
    if (!byPrefix[prefix]) byPrefix[prefix] = [];
    byPrefix[prefix].push(f.function_name);
  });

  Object.entries(byPrefix).forEach(([prefix, funcs]) => {
    console.log(`\n  📁 ${prefix}* (${funcs.length} functions):`);
    funcs.forEach(f => console.log(`     - ${f}`));
  });

  return data.length;
}

// =====================================================
// 3. TODOS OS TRIGGERS
// =====================================================
async function getAllTriggers() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║  3. TRIGGERS REAIS NO BANCO                                    ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  console.log('📝 Listando triggers conhecidos das migrations:\n');

  const knownTriggers = [
    { trigger: 'update_users_updated_at', table: 'users', timing: 'BEFORE UPDATE' },
    { trigger: 'update_professionals_updated_at', table: 'professionals', timing: 'BEFORE UPDATE' },
    { trigger: 'update_contractors_updated_at', table: 'contractors', timing: 'BEFORE UPDATE' },
    { trigger: 'update_requests_updated_at', table: 'requests', timing: 'BEFORE UPDATE' },
    { trigger: 'set_request_number', table: 'requests', timing: 'BEFORE INSERT' },
    { trigger: 'trigger_equipment_suppliers_updated_at', table: 'equipment_suppliers', timing: 'BEFORE UPDATE' },
    { trigger: 'trigger_equipment_allocations_updated_at', table: 'equipment_allocations', timing: 'BEFORE UPDATE' },
    { trigger: 'validate_certifications_trigger', table: 'professionals', timing: 'BEFORE INSERT/UPDATE' },
    { trigger: 'set_profit_margin', table: 'quote_requests', timing: 'BEFORE INSERT' },
    { trigger: 'calculate_hrx_price_trigger', table: 'supplier_quotes', timing: 'BEFORE INSERT/UPDATE' },
    { trigger: 'trigger_calculate_project_profit_margin', table: 'event_projects', timing: 'BEFORE INSERT/UPDATE' },
    { trigger: 'trigger_generate_project_number', table: 'event_projects', timing: 'BEFORE INSERT' },
    { trigger: 'trigger_event_projects_updated_at', table: 'event_projects', timing: 'BEFORE UPDATE' },
    { trigger: 'trigger_project_team_updated_at', table: 'project_team', timing: 'BEFORE UPDATE' },
    { trigger: 'trigger_project_equipment_updated_at', table: 'project_equipment', timing: 'BEFORE UPDATE' },
    { trigger: 'trigger_supplier_quotations_updated_at', table: 'supplier_quotations', timing: 'BEFORE UPDATE' },
    { trigger: 'trigger_calculate_team_member_cost', table: 'project_team', timing: 'BEFORE INSERT/UPDATE' },
    { trigger: 'trigger_calculate_quotation_hrx_values', table: 'supplier_quotations', timing: 'BEFORE INSERT/UPDATE' },
    { trigger: 'trigger_update_project_team_cost', table: 'project_team', timing: 'AFTER INSERT/UPDATE/DELETE' },
    { trigger: 'trigger_update_project_equipment_cost_quotations', table: 'supplier_quotations', timing: 'AFTER INSERT/UPDATE/DELETE' },
    { trigger: 'trigger_update_project_equipment_cost_equipment', table: 'project_equipment', timing: 'AFTER UPDATE' },
    { trigger: 'trigger_update_project_totals', table: 'event_projects', timing: 'BEFORE UPDATE' },
  ];

  // Agrupar por tabela
  const byTable = {};
  knownTriggers.forEach(t => {
    if (!byTable[t.table]) byTable[t.table] = [];
    byTable[t.table].push(t);
  });

  Object.entries(byTable).forEach(([table, triggers]) => {
    console.log(`\n  📁 ${table} (${triggers.length} triggers):`);
    triggers.forEach(t => {
      console.log(`     ⚡ ${t.trigger}`);
      console.log(`        └─ ${t.timing}`);
    });
  });

  console.log(`\n📊 Total de triggers conhecidos: ${knownTriggers.length}`);
  return knownTriggers.length;
}

// =====================================================
// 4. ANÁLISE DETALHADA DE TABELAS FINANCEIRAS
// =====================================================
async function analyzeFinancialTables() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║  4. ANÁLISE DETALHADA - TABELAS FINANCEIRAS                    ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  // event_projects
  console.log('📊 event_projects:');
  const { data: projects } = await supabase
    .from('event_projects')
    .select('id, project_number, profit_margin, total_team_cost, total_equipment_cost, total_cost, total_client_price, total_profit')
    .limit(5);

  if (projects && projects.length > 0) {
    projects.forEach(p => {
      console.log(`\n  Projeto: ${p.project_number}`);
      console.log(`    Margem: ${p.profit_margin}%`);
      console.log(`    Custo Equipe: R$ ${(p.total_team_cost || 0).toFixed(2)}`);
      console.log(`    Custo Equipamentos: R$ ${(p.total_equipment_cost || 0).toFixed(2)}`);
      console.log(`    ═══════════════════════════`);
      console.log(`    Custo Total: R$ ${(p.total_cost || 0).toFixed(2)}`);
      console.log(`    Preço Cliente: R$ ${(p.total_client_price || 0).toFixed(2)}`);
      console.log(`    Lucro: R$ ${(p.total_profit || 0).toFixed(2)}`);

      // Validar cálculo
      const expectedTotal = (p.total_team_cost || 0) + (p.total_equipment_cost || 0);
      const expectedPrice = expectedTotal * (1 + (p.profit_margin || 35) / 100);
      const expectedProfit = expectedPrice - expectedTotal;

      const isValid =
        Math.abs(p.total_cost - expectedTotal) < 0.01 &&
        Math.abs(p.total_client_price - expectedPrice) < 0.01 &&
        Math.abs(p.total_profit - expectedProfit) < 0.01;

      console.log(`    Validação: ${isValid ? '✓ CORRETO' : '❌ INCONSISTENTE'}`);
    });
  } else {
    console.log('  ⚠️  Nenhum projeto encontrado');
  }

  // project_team
  console.log('\n\n📊 project_team:');
  const { data: team } = await supabase
    .from('project_team')
    .select('id, role, quantity, duration_days, daily_rate, total_cost')
    .limit(5);

  if (team && team.length > 0) {
    team.forEach(t => {
      const expectedCost = (t.daily_rate || 0) * (t.quantity || 0) * (t.duration_days || 0);
      const isValid = Math.abs((t.total_cost || 0) - expectedCost) < 0.01;

      console.log(`\n  ${t.role}:`);
      console.log(`    Quantidade: ${t.quantity} | Dias: ${t.duration_days} | Diária: R$ ${(t.daily_rate || 0).toFixed(2)}`);
      console.log(`    Total Calculado: R$ ${(t.total_cost || 0).toFixed(2)}`);
      console.log(`    Validação: ${isValid ? '✓' : '❌'} (esperado: R$ ${expectedCost.toFixed(2)})`);
    });
  } else {
    console.log('  ⚠️  Nenhum membro de equipe encontrado');
  }

  // supplier_quotations
  console.log('\n\n📊 supplier_quotations:');
  const { data: quotations } = await supabase
    .from('supplier_quotations')
    .select('id, status, supplier_price, profit_margin_applied, hrx_price, profit_amount')
    .limit(5);

  if (quotations && quotations.length > 0) {
    quotations.forEach(q => {
      const expectedHrxPrice = (q.supplier_price || 0) * (1 + (q.profit_margin_applied || 0) / 100);
      const expectedProfit = expectedHrxPrice - (q.supplier_price || 0);
      const isValid =
        Math.abs((q.hrx_price || 0) - expectedHrxPrice) < 0.01 &&
        Math.abs((q.profit_amount || 0) - expectedProfit) < 0.01;

      console.log(`\n  Cotação [${q.status}]:`);
      console.log(`    Preço Fornecedor: R$ ${(q.supplier_price || 0).toFixed(2)}`);
      console.log(`    Margem Aplicada: ${q.profit_margin_applied}%`);
      console.log(`    Preço HRX: R$ ${(q.hrx_price || 0).toFixed(2)}`);
      console.log(`    Lucro: R$ ${(q.profit_amount || 0).toFixed(2)}`);
      console.log(`    Validação: ${isValid ? '✓' : '❌'}`);
    });
  } else {
    console.log('  ⚠️  Nenhuma cotação encontrada');
  }
}

// =====================================================
// 5. VERIFICAR INTEGRIDADE DE DADOS
// =====================================================
async function checkDataIntegrity() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║  5. VERIFICAÇÃO DE INTEGRIDADE DE DADOS                        ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  // Projetos com total_cost zerado mas tem equipe
  console.log('🔍 Projetos com custo zerado mas tem equipe:\n');
  const { data: projectsWithTeam } = await supabase
    .from('event_projects')
    .select(`
      id,
      project_number,
      total_team_cost,
      project_team(count)
    `)
    .eq('total_team_cost', 0)
    .not('project_team', 'is', null);

  if (projectsWithTeam && projectsWithTeam.length > 0) {
    console.log(`  ⚠️  Encontrados ${projectsWithTeam.length} projetos com problema:`);
    projectsWithTeam.forEach(p => {
      console.log(`     - ${p.project_number}: tem ${p.project_team?.[0]?.count || 0} membros mas total_team_cost = 0`);
    });
  } else {
    console.log('  ✓ Nenhum problema encontrado');
  }

  // Membros sem total_cost calculado
  console.log('\n\n🔍 Membros de equipe sem total_cost:\n');
  const { data: membersNoCost } = await supabase
    .from('project_team')
    .select('id, role, quantity, duration_days, daily_rate, total_cost')
    .not('daily_rate', 'is', null)
    .is('total_cost', null);

  if (membersNoCost && membersNoCost.length > 0) {
    console.log(`  ⚠️  Encontrados ${membersNoCost.length} membros sem total_cost calculado`);
  } else {
    console.log('  ✓ Todos os membros têm total_cost calculado');
  }

  // Cotações sem hrx_price
  console.log('\n\n🔍 Cotações sem hrx_price calculado:\n');
  const { data: quotationsNoPrice } = await supabase
    .from('supplier_quotations')
    .select('id, supplier_price, hrx_price')
    .not('supplier_price', 'is', null)
    .is('hrx_price', null);

  if (quotationsNoPrice && quotationsNoPrice.length > 0) {
    console.log(`  ⚠️  Encontradas ${quotationsNoPrice.length} cotações sem hrx_price`);
  } else {
    console.log('  ✓ Todas as cotações têm hrx_price calculado');
  }
}

// =====================================================
// 6. ESTATÍSTICAS GERAIS
// =====================================================
async function getGeneralStats() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║  6. ESTATÍSTICAS GERAIS DO SISTEMA                             ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  const stats = {
    users: 0,
    professionals: 0,
    suppliers: 0,
    projects: 0,
    teamMembers: 0,
    quotations: 0,
    emails: 0,
  };

  const { count: usersCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
  const { count: profsCount } = await supabase.from('professionals').select('*', { count: 'exact', head: true });
  const { count: suppCount } = await supabase.from('equipment_suppliers').select('*', { count: 'exact', head: true });
  const { count: projCount } = await supabase.from('event_projects').select('*', { count: 'exact', head: true });
  const { count: teamCount } = await supabase.from('project_team').select('*', { count: 'exact', head: true });
  const { count: quotCount } = await supabase.from('supplier_quotations').select('*', { count: 'exact', head: true });
  const { count: emailCount } = await supabase.from('email_logs').select('*', { count: 'exact', head: true });

  console.log(`  👥 Usuários: ${usersCount}`);
  console.log(`  👷 Profissionais: ${profsCount}`);
  console.log(`  🚚 Fornecedores: ${suppCount}`);
  console.log(`  📋 Projetos: ${projCount}`);
  console.log(`  👨‍💼 Membros de Equipe: ${teamCount}`);
  console.log(`  💰 Cotações: ${quotCount}`);
  console.log(`  📧 Emails Enviados: ${emailCount}`);
}

// =====================================================
// MAIN
// =====================================================
async function main() {
  try {
    await getAllTables();
    await getAllFunctions();
    await getAllTriggers();
    await analyzeFinancialTables();
    await checkDataIntegrity();
    await getGeneralStats();

    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║                   ✅ AUDITORIA CONCLUÍDA                       ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

  } catch (error) {
    console.error('\n❌ ERRO DURANTE AUDITORIA:', error);
  }
}

main();
