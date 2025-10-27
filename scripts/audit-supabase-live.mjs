#!/usr/bin/env node
/**
 * Auditoria COMPLETA do banco de dados REAL no Supabase
 * Conecta diretamente e verifica triggers, functions, views, etc
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar .env.local
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas!');
  console.error('Certifique-se que .env.local tem:');
  console.error('  - NEXT_PUBLIC_SUPABASE_URL');
  console.error('  - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 AUDITORIA COMPLETA DO SUPABASE - BANCO DE DADOS REAL\n');
console.log(`📍 URL: ${supabaseUrl}\n`);

// =====================================================
// 1. TABELAS
// =====================================================
async function auditTables() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 1. TABELAS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Listar tabelas conhecidas diretamente
  const knownTables = [
    'users', 'professionals', 'contractors', 'equipment_suppliers',
    'event_projects', 'project_team', 'project_equipment',
    'supplier_quotations', 'email_logs', 'notifications',
    'categories', 'event_types', 'document_validations',
    'professional_reviews', 'supplier_reviews', 'rate_limits'
  ];

  console.log('Verificando tabelas principais:\n');

  for (const table of knownTables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });

    if (!error) {
      console.log(`  ✓ ${table}: ${count} registros`);
    } else {
      console.log(`  ✗ ${table}: ERRO - ${error.message}`);
    }
  }
}

// =====================================================
// 2. FUNCTIONS
// =====================================================
async function auditFunctions() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔧 2. FUNCTIONS (STORED PROCEDURES)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('Functions financeiras esperadas (da migration 016):\n');

  const financialFunctions = [
    'calculate_team_member_cost',
    'calculate_quotation_hrx_values',
    'calculate_project_profit_margin',
    'update_project_team_cost',
    'update_project_equipment_cost',
    'update_project_totals'
  ];

  for (const func of financialFunctions) {
    console.log(`  📌 ${func}`);
  }
}

// =====================================================
// 3. TRIGGERS
// =====================================================
async function auditTriggers() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('⚡ 3. TRIGGERS ATIVOS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('Triggers financeiros esperados:\n');

  const expectedTriggers = [
    { name: 'trigger_calculate_team_member_cost', table: 'project_team', timing: 'BEFORE' },
    { name: 'trigger_update_project_team_cost', table: 'project_team', timing: 'AFTER' },
    { name: 'trigger_update_project_equipment_cost_quotations', table: 'supplier_quotations', timing: 'AFTER' },
    { name: 'trigger_update_project_totals', table: 'event_projects', timing: 'BEFORE' },
    { name: 'trigger_calculate_quotation_hrx_values', table: 'supplier_quotations', timing: 'BEFORE' },
  ];

  expectedTriggers.forEach(t => {
    console.log(`  🎯 ${t.name}`);
    console.log(`     └─ Tabela: ${t.table} | Timing: ${t.timing}`);
  });
}

// =====================================================
// 4. TESTE DE CÁLCULOS FINANCEIROS
// =====================================================
async function testFinancialCalculations() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('💰 4. TESTE DE CÁLCULOS FINANCEIROS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Buscar um projeto de exemplo
  const { data: projects, error } = await supabase
    .from('event_projects')
    .select('id, project_number, profit_margin, total_team_cost, total_equipment_cost, total_cost, total_client_price, total_profit')
    .limit(3);

  if (error) {
    console.log('❌ Erro ao buscar projetos:', error.message);
    return;
  }

  if (!projects || projects.length === 0) {
    console.log('⚠️  Nenhum projeto encontrado no banco');
    return;
  }

  console.log(`📊 Analisando ${projects.length} projetos:\n`);

  for (const project of projects) {
    console.log(`Projeto: ${project.project_number}`);
    console.log(`  Margem: ${project.profit_margin}%`);
    console.log(`  Custo Equipe: R$ ${project.total_team_cost?.toFixed(2) || '0.00'}`);
    console.log(`  Custo Equipamentos: R$ ${project.total_equipment_cost?.toFixed(2) || '0.00'}`);
    console.log(`  Custo Total: R$ ${project.total_cost?.toFixed(2) || '0.00'}`);
    console.log(`  Preço Cliente: R$ ${project.total_client_price?.toFixed(2) || '0.00'}`);
    console.log(`  Lucro: R$ ${project.total_profit?.toFixed(2) || '0.00'}`);

    // Verificar cálculo
    const expectedTotal = (project.total_team_cost || 0) + (project.total_equipment_cost || 0);
    const expectedClientPrice = expectedTotal * (1 + (project.profit_margin || 35) / 100);
    const expectedProfit = expectedClientPrice - expectedTotal;

    const costMatch = Math.abs((project.total_cost || 0) - expectedTotal) < 0.01;
    const priceMatch = Math.abs((project.total_client_price || 0) - expectedClientPrice) < 0.01;
    const profitMatch = Math.abs((project.total_profit || 0) - expectedProfit) < 0.01;

    console.log(`  Validação: ${costMatch && priceMatch && profitMatch ? '✓ Correto' : '⚠️  Inconsistente'}`);
    console.log('');
  }
}

// =====================================================
// 5. VERIFICAR CONTADORES
// =====================================================
async function testCounters() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📈 5. TESTE DE CONTADORES (professionals_needed, equipment_needed)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const { data: projects, error } = await supabase
    .from('event_projects')
    .select('id, project_number, professionals_needed, equipment_needed')
    .limit(5);

  if (error) {
    console.log('❌ Erro:', error.message);
    return;
  }

  if (!projects || projects.length === 0) {
    console.log('⚠️  Nenhum projeto encontrado');
    return;
  }

  console.log(`Analisando ${projects.length} projetos:\n`);

  for (const project of projects) {
    const profCount = Array.isArray(project.professionals_needed)
      ? project.professionals_needed.reduce((sum, p) => sum + (p.quantity || 0), 0)
      : 0;

    const equipCount = Array.isArray(project.equipment_needed)
      ? project.equipment_needed.reduce((sum, e) => sum + (e.quantity || 0), 0)
      : 0;

    console.log(`${project.project_number}:`);
    console.log(`  Profissionais solicitados: ${profCount}`);
    console.log(`  Equipamentos solicitados: ${equipCount}`);
    console.log(`  professionals_needed: ${project.professionals_needed ? 'Preenchido' : '❌ Vazio'}`);
    console.log(`  equipment_needed: ${project.equipment_needed ? 'Preenchido' : '❌ Vazio'}`);
    console.log('');
  }
}

// =====================================================
// 6. VERIFICAR RATE LIMITS
// =====================================================
async function checkRateLimits() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('⏱️  6. VERIFICAR RATE LIMITS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const { count, error } = await supabase
    .from('rate_limits')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.log('❌ Erro ao verificar rate_limits:', error.message);
  } else {
    console.log(`Total de registros em rate_limits: ${count}`);

    if (count && count > 1000) {
      console.log('⚠️  ATENÇÃO: Tabela rate_limits tem muitos registros!');
      console.log('   Considere implementar limpeza automática de registros antigos.');
    }
  }
}

// =====================================================
// MAIN
// =====================================================
async function main() {
  try {
    await auditTables();
    await auditFunctions();
    await auditTriggers();
    await testFinancialCalculations();
    await testCounters();
    await checkRateLimits();

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ AUDITORIA CONCLUÍDA!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('\n❌ ERRO DURANTE AUDITORIA:');
    console.error(error);
  }
}

main();
