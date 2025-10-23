#!/usr/bin/env node

/**
 * Script para adicionar coluna equipment_supplier_id via SQL direto
 * Como não conseguimos executar DDL via API, este script mostra o SQL para copiar/colar
 */

console.log(`
╔════════════════════════════════════════════════════════════════════════╗
║                                                                        ║
║  🔧 MIGRATION NECESSÁRIA                                              ║
║                                                                        ║
║  A tabela event_projects precisa da coluna equipment_supplier_id      ║
║                                                                        ║
╚════════════════════════════════════════════════════════════════════════╝

📋 COPIE E COLE O SQL ABAIXO NO SUPABASE SQL EDITOR:

👉 https://supabase.com/dashboard/project/waplbfawlcavwtvfwprf/sql/new

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

const sql = `-- Migration: Add equipment_supplier_id to event_projects
-- Description: Stores the selected supplier when a quotation is accepted

ALTER TABLE public.event_projects
ADD COLUMN equipment_supplier_id uuid REFERENCES public.equipment_suppliers(id) ON DELETE SET NULL;

-- Add index for faster lookups
CREATE INDEX idx_event_projects_equipment_supplier ON public.event_projects(equipment_supplier_id);

-- Add comment
COMMENT ON COLUMN public.event_projects.equipment_supplier_id IS 'ID do fornecedor cujo orçamento foi aceito para equipamentos';`;

console.log(sql);

console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ DEPOIS DE EXECUTAR NO SUPABASE:

1. Volte aqui e pressione ENTER para continuar
2. Ou execute o seed novamente: node scripts/seed-quotation-test.mjs

`);

// Aguardar usuário
import readline from 'readline';
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Executou o SQL no Supabase? (s/n): ', (answer) => {
  if (answer.toLowerCase() === 's' || answer.toLowerCase() === 'sim') {
    console.log('\n✅ Ótimo! Agora o fluxo completo deve funcionar.\n');
    console.log('🧪 Execute novamente o seed para testar:\n');
    console.log('   node scripts/seed-quotation-test.mjs\n');
  } else {
    console.log('\n⚠️ Execute o SQL no Supabase para continuar.\n');
  }
  rl.close();
});
