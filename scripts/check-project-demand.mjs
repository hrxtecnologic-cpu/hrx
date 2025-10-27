#!/usr/bin/env node
/**
 * Script para verificar demanda do cliente em projetos
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n🔍 Buscando projetos com "Feira" ou "Teste" no nome...\n');

const { data, error } = await supabase
  .from('event_projects')
  .select('*')
  .or('event_name.ilike.%Feira%,event_name.ilike.%Teste%')
  .order('created_at', { ascending: false })
  .limit(5);

if (error) {
  console.error('❌ Erro:', error.message);
  process.exit(1);
}

if (!data || data.length === 0) {
  console.log('⚠️  Nenhum projeto encontrado\n');
  process.exit(0);
}

console.log(`✅ Encontrados ${data.length} projetos\n`);

data.forEach((p, index) => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📋 PROJETO ${index + 1}`);
  console.log(`${'='.repeat(60)}`);
  console.log(`ID: ${p.id}`);
  console.log(`Número: ${p.project_number}`);
  console.log(`Nome: ${p.event_name}`);
  console.log(`Cliente: ${p.client_name}`);
  console.log(`Status: ${p.status}`);
  console.log(`Criado em: ${p.created_at}`);

  console.log(`\n📊 DEMANDA DO CLIENTE:`);
  console.log(`${'─'.repeat(60)}`);

  // Profissionais
  if (p.professionals_needed && Array.isArray(p.professionals_needed) && p.professionals_needed.length > 0) {
    console.log(`\n👥 Profissionais Solicitados (${p.professionals_needed.length}):`);
    p.professionals_needed.forEach((prof, i) => {
      console.log(`  ${i + 1}. ${prof.category || 'Sem categoria'}`);
      console.log(`     Quantidade: ${prof.quantity || 0}`);
      if (prof.subcategory) console.log(`     Subcategoria: ${prof.subcategory}`);
      if (prof.notes) console.log(`     Notas: ${prof.notes}`);
    });
  } else {
    console.log(`\n❌ professionals_needed: VAZIO ou NULL`);
  }

  // Equipamentos
  if (p.equipment_needed && Array.isArray(p.equipment_needed) && p.equipment_needed.length > 0) {
    console.log(`\n📦 Equipamentos Solicitados (${p.equipment_needed.length}):`);
    p.equipment_needed.forEach((equip, i) => {
      console.log(`  ${i + 1}. ${equip.type || equip.category || 'Sem tipo'}`);
      console.log(`     Quantidade: ${equip.quantity || 0}`);
      if (equip.notes) console.log(`     Notas: ${equip.notes}`);
    });
  } else {
    console.log(`\n❌ equipment_needed: VAZIO ou NULL`);
  }
});

console.log(`\n${'='.repeat(60)}\n`);
