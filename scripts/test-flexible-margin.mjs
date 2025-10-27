#!/usr/bin/env node
/**
 * Script para testar a migration 033 - Margem de Lucro Flexível
 *
 * Testa:
 * 1. Margem padrão (35% para normal, 80% para urgente)
 * 2. Margem personalizada (0-100%)
 * 3. Validação de limites (rejeita < 0 ou > 100)
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n🧪 TESTE: Migration 033 - Margem de Lucro Flexível\n');
console.log('='.repeat(60));

// =====================================================
// TESTE 1: Margem Padrão para Projeto Normal (35%)
// =====================================================

console.log('\n📝 TESTE 1: Criar projeto normal (margem padrão 35%)');

const { data: projeto1, error: erro1 } = await supabase
  .from('event_projects')
  .insert({
    client_name: 'Teste Margem Normal',
    client_email: 'teste1@teste.com',
    client_phone: '11999999999',
    event_type: 'Teste',
    event_name: 'Teste Migration 033 - Normal',
    event_date: '2025-12-01',
    venue_name: 'Local Teste',
    venue_address: 'Rua Teste, 123',
    venue_city: 'São Paulo',
    venue_state: 'SP',
    is_urgent: false,  // Margem padrão: 35%
    // NÃO definir profit_margin → deve usar padrão
  })
  .select()
  .single();

if (erro1) {
  console.error('❌ Erro:', erro1.message);
} else {
  const margem = parseFloat(projeto1.profit_margin);
  if (margem === 35.00) {
    console.log(`✅ PASSOU: Margem = ${margem}% (esperado: 35%)`);
  } else {
    console.log(`❌ FALHOU: Margem = ${margem}% (esperado: 35%)`);
  }
}

// =====================================================
// TESTE 2: Margem Padrão para Projeto Urgente (80%)
// =====================================================

console.log('\n📝 TESTE 2: Criar projeto urgente (margem padrão 80%)');

const { data: projeto2, error: erro2 } = await supabase
  .from('event_projects')
  .insert({
    client_name: 'Teste Margem Urgente',
    client_email: 'teste2@teste.com',
    client_phone: '11999999999',
    event_type: 'Teste',
    event_name: 'Teste Migration 033 - Urgente',
    event_date: '2025-12-01',
    venue_name: 'Local Teste',
    venue_address: 'Rua Teste, 123',
    venue_city: 'São Paulo',
    venue_state: 'SP',
    is_urgent: true,  // Margem padrão: 80%
    // NÃO definir profit_margin → deve usar padrão
  })
  .select()
  .single();

if (erro2) {
  console.error('❌ Erro:', erro2.message);
} else {
  const margem = parseFloat(projeto2.profit_margin);
  if (margem === 80.00) {
    console.log(`✅ PASSOU: Margem = ${margem}% (esperado: 80%)`);
  } else {
    console.log(`❌ FALHOU: Margem = ${margem}% (esperado: 80%)`);
  }
}

// =====================================================
// TESTE 3: Margem Personalizada (50%)
// =====================================================

console.log('\n📝 TESTE 3: Criar projeto com margem PERSONALIZADA (50%)');

const { data: projeto3, error: erro3 } = await supabase
  .from('event_projects')
  .insert({
    client_name: 'Teste Margem Personalizada',
    client_email: 'teste3@teste.com',
    client_phone: '11999999999',
    event_type: 'Teste',
    event_name: 'Teste Migration 033 - Custom 50%',
    event_date: '2025-12-01',
    venue_name: 'Local Teste',
    venue_address: 'Rua Teste, 123',
    venue_city: 'São Paulo',
    venue_state: 'SP',
    is_urgent: false,
    profit_margin: 50.00,  // Margem PERSONALIZADA
  })
  .select()
  .single();

if (erro3) {
  console.error('❌ Erro:', erro3.message);
} else {
  const margem = parseFloat(projeto3.profit_margin);
  if (margem === 50.00) {
    console.log(`✅ PASSOU: Margem = ${margem}% (esperado: 50%)`);
  } else {
    console.log(`❌ FALHOU: Margem = ${margem}% (esperado: 50%)`);
  }
}

// =====================================================
// TESTE 4: Margem Mínima (0%)
// =====================================================

console.log('\n📝 TESTE 4: Criar projeto com margem MÍNIMA (0%)');

const { data: projeto4, error: erro4 } = await supabase
  .from('event_projects')
  .insert({
    client_name: 'Teste Margem Zero',
    client_email: 'teste4@teste.com',
    client_phone: '11999999999',
    event_type: 'Teste',
    event_name: 'Teste Migration 033 - Zero',
    event_date: '2025-12-01',
    venue_name: 'Local Teste',
    venue_address: 'Rua Teste, 123',
    venue_city: 'São Paulo',
    venue_state: 'SP',
    profit_margin: 0.00,  // Margem ZERO (sem lucro)
  })
  .select()
  .single();

if (erro4) {
  console.error('❌ Erro:', erro4.message);
} else {
  const margem = parseFloat(projeto4.profit_margin);
  if (margem === 0.00) {
    console.log(`✅ PASSOU: Margem = ${margem}% (esperado: 0%)`);
  } else {
    console.log(`❌ FALHOU: Margem = ${margem}% (esperado: 0%)`);
  }
}

// =====================================================
// TESTE 5: Margem Máxima (100%)
// =====================================================

console.log('\n📝 TESTE 5: Criar projeto com margem MÁXIMA (100%)');

const { data: projeto5, error: erro5 } = await supabase
  .from('event_projects')
  .insert({
    client_name: 'Teste Margem Máxima',
    client_email: 'teste5@teste.com',
    client_phone: '11999999999',
    event_type: 'Teste',
    event_name: 'Teste Migration 033 - Max',
    event_date: '2025-12-01',
    venue_name: 'Local Teste',
    venue_address: 'Rua Teste, 123',
    venue_city: 'São Paulo',
    venue_state: 'SP',
    profit_margin: 100.00,  // Margem 100% (dobra o preço)
  })
  .select()
  .single();

if (erro5) {
  console.error('❌ Erro:', erro5.message);
} else {
  const margem = parseFloat(projeto5.profit_margin);
  if (margem === 100.00) {
    console.log(`✅ PASSOU: Margem = ${margem}% (esperado: 100%)`);
  } else {
    console.log(`❌ FALHOU: Margem = ${margem}% (esperado: 100%)`);
  }
}

// =====================================================
// TESTE 6: Margem INVÁLIDA (< 0) - Deve REJEITAR
// =====================================================

console.log('\n📝 TESTE 6: Tentar criar projeto com margem INVÁLIDA (-10%)');

const { data: projeto6, error: erro6 } = await supabase
  .from('event_projects')
  .insert({
    client_name: 'Teste Margem Negativa',
    client_email: 'teste6@teste.com',
    client_phone: '11999999999',
    event_type: 'Teste',
    event_name: 'Teste Migration 033 - Negativa',
    event_date: '2025-12-01',
    venue_name: 'Local Teste',
    venue_address: 'Rua Teste, 123',
    venue_city: 'São Paulo',
    venue_state: 'SP',
    profit_margin: -10.00,  // INVÁLIDO (negativo)
  })
  .select()
  .single();

if (erro6) {
  console.log(`✅ PASSOU: Rejeitou margem negativa (esperado)`);
  console.log(`   Erro: ${erro6.message}`);
} else {
  console.log(`❌ FALHOU: Aceitou margem negativa (não deveria!)`);
}

// =====================================================
// TESTE 7: Margem INVÁLIDA (> 100) - Deve REJEITAR
// =====================================================

console.log('\n📝 TESTE 7: Tentar criar projeto com margem INVÁLIDA (150%)');

const { data: projeto7, error: erro7 } = await supabase
  .from('event_projects')
  .insert({
    client_name: 'Teste Margem Acima',
    client_email: 'teste7@teste.com',
    client_phone: '11999999999',
    event_type: 'Teste',
    event_name: 'Teste Migration 033 - Acima',
    event_date: '2025-12-01',
    venue_name: 'Local Teste',
    venue_address: 'Rua Teste, 123',
    venue_city: 'São Paulo',
    venue_state: 'SP',
    profit_margin: 150.00,  // INVÁLIDO (> 100)
  })
  .select()
  .single();

if (erro7) {
  console.log(`✅ PASSOU: Rejeitou margem > 100% (esperado)`);
  console.log(`   Erro: ${erro7.message}`);
} else {
  console.log(`❌ FALHOU: Aceitou margem > 100% (não deveria!)`);
}

// =====================================================
// TESTE 8: Atualizar Margem de Projeto Existente
// =====================================================

console.log('\n📝 TESTE 8: Atualizar margem de projeto existente (35% → 42%)');

if (projeto1?.id) {
  const { data: atualizado, error: erroUpdate } = await supabase
    .from('event_projects')
    .update({ profit_margin: 42.00 })
    .eq('id', projeto1.id)
    .select()
    .single();

  if (erroUpdate) {
    console.error('❌ Erro:', erroUpdate.message);
  } else {
    const margem = parseFloat(atualizado.profit_margin);
    if (margem === 42.00) {
      console.log(`✅ PASSOU: Margem atualizada = ${margem}% (esperado: 42%)`);
    } else {
      console.log(`❌ FALHOU: Margem = ${margem}% (esperado: 42%)`);
    }
  }
}

// =====================================================
// LIMPEZA
// =====================================================

console.log('\n🧹 Limpando projetos de teste...');

const idsParaRemover = [
  projeto1?.id,
  projeto2?.id,
  projeto3?.id,
  projeto4?.id,
  projeto5?.id,
].filter(Boolean);

if (idsParaRemover.length > 0) {
  const { error: erroDelete } = await supabase
    .from('event_projects')
    .delete()
    .in('id', idsParaRemover);

  if (erroDelete) {
    console.error('❌ Erro ao limpar:', erroDelete.message);
  } else {
    console.log(`✅ ${idsParaRemover.length} projetos de teste removidos`);
  }
}

console.log('\n' + '='.repeat(60));
console.log('✅ TESTES CONCLUÍDOS!\n');
