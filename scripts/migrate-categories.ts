/**
 * Script de Migração: Categories → Subcategories
 *
 * Este script migra os dados do campo categories (array) para subcategories (JSONB)
 * em todos os profissionais existentes.
 *
 * Uso:
 *   npx tsx scripts/migrate-categories.ts
 *
 * Ou com opções:
 *   npx tsx scripts/migrate-categories.ts --dry-run  (apenas simula)
 *   npx tsx scripts/migrate-categories.ts --verbose   (mais detalhes)
 */

import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: Variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Argumentos da linha de comando
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isVerbose = args.includes('--verbose');

interface Professional {
  id: string;
  full_name: string;
  email: string;
  categories: string[] | null;
  subcategories: Record<string, string[]> | null;
}

/**
 * Converte array de categories para objeto subcategories
 */
function convertCategoriesToSubcategories(categories: string[]): Record<string, string[]> {
  const subcategories: Record<string, string[]> = {};

  for (const category of categories) {
    // Criar subcategoria "geral" para cada categoria
    // Os profissionais podem atualizar depois para subcategorias específicas
    subcategories[category] = ['geral'];
  }

  return subcategories;
}

/**
 * Migra um profissional
 */
async function migrateProfessional(professional: Professional): Promise<boolean> {
  if (!professional.categories || professional.categories.length === 0) {
    if (isVerbose) {
      console.log(`⏭️  Pulando ${professional.full_name} - sem categories`);
    }
    return false;
  }

  // Verificar se já foi migrado
  if (professional.subcategories && Object.keys(professional.subcategories).length > 0) {
    if (isVerbose) {
      console.log(`✅ ${professional.full_name} - já migrado`);
    }
    return false;
  }

  const newSubcategories = convertCategoriesToSubcategories(professional.categories);

  if (isVerbose) {
    console.log(`\n📝 Migrando: ${professional.full_name}`);
    console.log(`   Categories: ${JSON.stringify(professional.categories)}`);
    console.log(`   Subcategories: ${JSON.stringify(newSubcategories)}`);
  }

  if (isDryRun) {
    console.log(`   [DRY RUN] Não aplicado - apenas simulação`);
    return true;
  }

  // Atualizar no banco
  const { error } = await supabase
    .from('professionals')
    .update({ subcategories: newSubcategories })
    .eq('id', professional.id);

  if (error) {
    console.error(`❌ Erro ao migrar ${professional.full_name}:`, error.message);
    return false;
  }

  if (isVerbose) {
    console.log(`   ✅ Migrado com sucesso!`);
  }

  return true;
}

/**
 * Executa a migração
 */
async function runMigration() {
  console.log('\n🚀 Iniciando Migração de Categories → Subcategories\n');
  console.log('=' .repeat(60));

  if (isDryRun) {
    console.log('⚠️  MODO DRY RUN - Nenhuma alteração será salva no banco');
    console.log('=' .repeat(60));
  }

  // Buscar todos os profissionais
  const { data: professionals, error } = await supabase
    .from('professionals')
    .select('id, full_name, email, categories, subcategories')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('❌ Erro ao buscar profissionais:', error.message);
    process.exit(1);
  }

  if (!professionals || professionals.length === 0) {
    console.log('ℹ️  Nenhum profissional encontrado no banco de dados');
    return;
  }

  console.log(`\n📊 Total de profissionais: ${professionals.length}\n`);

  let migrated = 0;
  let skipped = 0;
  let failed = 0;

  // Processar cada profissional
  for (const professional of professionals) {
    try {
      const result = await migrateProfessional(professional);
      if (result) {
        migrated++;
        if (!isVerbose) {
          process.stdout.write('.');
        }
      } else {
        skipped++;
      }
    } catch (err) {
      failed++;
      console.error(`\n❌ Erro inesperado ao processar ${professional.full_name}:`, err);
    }
  }

  // Resumo final
  console.log('\n\n' + '='.repeat(60));
  console.log('📊 RESUMO DA MIGRAÇÃO');
  console.log('='.repeat(60));
  console.log(`✅ Migrados: ${migrated}`);
  console.log(`⏭️  Pulados: ${skipped}`);
  console.log(`❌ Erros: ${failed}`);
  console.log(`📈 Total: ${professionals.length}`);
  console.log('='.repeat(60));

  if (isDryRun) {
    console.log('\n⚠️  Esta foi uma simulação. Execute sem --dry-run para aplicar as mudanças.');
  } else if (migrated > 0) {
    console.log('\n✅ Migração concluída com sucesso!');
    console.log('\n💡 Próximos passos:');
    console.log('   1. Verifique os dados no Supabase');
    console.log('   2. Teste o cadastro de novos profissionais');
    console.log('   3. Os profissionais podem atualizar para subcategorias específicas');
  }

  console.log('');
}

// Executar migração
runMigration().catch((err) => {
  console.error('\n❌ Erro fatal:', err);
  process.exit(1);
});
