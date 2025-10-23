#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SUPABASE_URL = 'https://waplbfawlcavwtvfwprf.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhcGxiZmF3bGNhdnd0dmZ3cHJmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDg4MDE2MSwiZXhwIjoyMDc2NDU2MTYxfQ.4f_wtj8epcr-39D3LX71Tw4TmalNRVJQPMxdOL689Yk';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('🔧 Aplicando migration 017...\n');

// Ler o arquivo SQL
const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '017_add_equipment_supplier_to_projects.sql');
const sql = readFileSync(migrationPath, 'utf8');

console.log('📄 SQL a ser executado:');
console.log(sql);
console.log('\n🚀 Executando...\n');

// Executar via RPC (usando função sql do Supabase)
try {
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

  if (error) {
    // Se não existe a função exec_sql, vamos tentar via fetch direto
    console.log('⚠️ RPC não disponível, tentando via REST API...\n');

    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
      body: JSON.stringify({ query: sql })
    });

    if (!response.ok) {
      console.error('❌ Erro ao executar migration via REST:', await response.text());
      console.log('\n📋 EXECUTE MANUALMENTE NO SUPABASE SQL EDITOR:\n');
      console.log(sql);
      process.exit(1);
    }
  }

  console.log('✅ Migration aplicada com sucesso!\n');
  console.log('🔍 Verificando coluna adicionada...\n');

  // Verificar se a coluna foi adicionada
  const { data: columns, error: columnError } = await supabase
    .from('event_projects')
    .select('equipment_supplier_id')
    .limit(1);

  if (columnError) {
    console.error('❌ Erro ao verificar coluna:', columnError);
    console.log('\n📋 EXECUTE MANUALMENTE NO SUPABASE SQL EDITOR:\n');
    console.log(sql);
  } else {
    console.log('✅ Coluna equipment_supplier_id adicionada e funcionando!\n');
  }

} catch (error) {
  console.error('❌ Erro ao executar migration:', error);
  console.log('\n📋 EXECUTE MANUALMENTE NO SUPABASE SQL EDITOR:\n');
  console.log(sql);
  process.exit(1);
}
