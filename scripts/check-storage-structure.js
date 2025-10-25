require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkStorageStructure() {
  console.log('📁 VERIFICANDO ESTRUTURA DE DOCUMENTOS NO STORAGE\n');
  console.log('==================================================\n');

  try {
    // Pegar alguns clerk_ids da lista
    const testClerkIds = [
      'user_34NY6svOFqJHinr23XYuezJOkEK', // alveselizabete.alves@gmail.com
      'user_34NZLccSqEMShbNlizcudlTqqR6', // daniloevangelista02@gmail.com
      'user_34Nvu3xpOBaZLlsUbOIPPnZ07Pu'  // lilisantanaebrunodomingues@gmail.com
    ];

    for (const clerkId of testClerkIds) {
      console.log(`\n📁 Verificando: ${clerkId}\n`);

      const { data: files, error } = await supabase.storage
        .from('professional-documents')
        .list(clerkId, {
          limit: 100,
          sortBy: { column: 'name', order: 'asc' }
        });

      if (error) {
        console.log(`  ❌ Erro: ${error.message}`);
        continue;
      }

      if (files && files.length > 0) {
        console.log(`  ✅ ${files.length} arquivos encontrados:\n`);
        files.forEach(file => {
          console.log(`    - ${file.name}`);
          console.log(`      Tamanho: ${file.metadata?.size || 0} bytes`);
          console.log(`      Tipo: ${file.metadata?.mimetype || 'unknown'}`);
          console.log(`      Criado: ${file.created_at}`);
          console.log('');
        });
      } else {
        console.log('  ⚠️  Nenhum arquivo encontrado nesta pasta');
      }
    }

    console.log('\n==================================================\n');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error(error);
  }
}

checkStorageStructure();
