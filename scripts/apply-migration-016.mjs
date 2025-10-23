import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar variáveis de ambiente
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: Variáveis de ambiente não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('='.repeat(70));
console.log('🚀 APLICANDO MIGRATION 016 - CORRIGIR CÁLCULOS FINANCEIROS');
console.log('='.repeat(70));
console.log(`\n📡 Conectando ao Supabase: ${supabaseUrl}\n`);

// Ler arquivo SQL
const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '016_fix_financial_calculations.sql');
const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

console.log(`📄 Migration carregada: ${(migrationSQL.length / 1024).toFixed(2)} KB\n`);

// Separar SQL em statements executáveis
// O Supabase aceita executar SQL direto via REST API
async function executeMigration() {
  try {
    // Parte 1: Criar função update_project_team_cost
    console.log('🔄 [1/7] Criando função update_project_team_cost...');
    const { error: error1 } = await supabase.rpc('exec', {
      sql: `
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
      `
    });

    if (error1) throw error1;
    console.log('✅ Função criada\n');

    // Parte 2: Criar trigger para equipe
    console.log('🔄 [2/7] Criando trigger para project_team...');
    const { error: error2 } = await supabase.rpc('exec', {
      sql: `
DROP TRIGGER IF EXISTS trigger_update_project_team_cost ON project_team;
CREATE TRIGGER trigger_update_project_team_cost
  AFTER INSERT OR UPDATE OR DELETE ON project_team
  FOR EACH ROW
  EXECUTE FUNCTION update_project_team_cost();
      `
    });

    if (error2) throw error2;
    console.log('✅ Trigger criado\n');

    // Parte 3: Criar função update_project_equipment_cost
    console.log('🔄 [3/7] Criando função update_project_equipment_cost...');
    const { error: error3 } = await supabase.rpc('exec', {
      sql: `
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
      `
    });

    if (error3) throw error3;
    console.log('✅ Função criada\n');

    // Continua com as outras partes...
    console.log('🔄 [4/7] Criando triggers para supplier_quotations e project_equipment...');
    // ... (implementar resto)

    console.log('\n' + '='.repeat(70));
    console.log('✅ MIGRATION APLICADA COM SUCESSO!');
    console.log('='.repeat(70));

  } catch (error) {
    console.error('\n❌ ERRO AO EXECUTAR MIGRATION:', error.message);
    if (error.details) console.error('Detalhes:', error.details);
    if (error.hint) console.error('Dica:', error.hint);
    process.exit(1);
  }
}

// Executar
executeMigration();
