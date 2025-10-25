require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkContractorsWithDocuments() {
  console.log('\n🔍 VERIFICANDO CONTRACTORS COM DOCUMENTOS NO STORAGE\n');
  console.log('==================================================\n');

  try {
    // 1. Buscar contractors
    const { data: contractors } = await supabase
      .from('users')
      .select('id, clerk_id, email, full_name, user_type, created_at')
      .eq('user_type', 'contractor')
      .order('created_at', { ascending: false });

    console.log(`📊 Total de contractors: ${contractors.length}\n`);

    // 2. Listar buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

    if (bucketsError) throw bucketsError;

    console.log('📦 Buckets disponíveis:');
    buckets.forEach(bucket => {
      console.log(`  - ${bucket.name} (${bucket.public ? 'público' : 'privado'})`);
    });
    console.log('');

    // 3. Buckets onde podem estar documentos
    const documentBuckets = ['professional-documents', 'documents', 'uploads', 'professionals'];

    let contractorsWithDocuments = [];
    let totalFilesFound = 0;

    for (const bucketName of documentBuckets) {
      console.log(`🔍 Verificando bucket: ${bucketName}...`);

      // Listar todos os arquivos do bucket (pode precisar listar recursivamente se houver pastas)
      const { data: files, error } = await supabase.storage
        .from(bucketName)
        .list('', {
          limit: 10000,
          sortBy: { column: 'name', order: 'asc' }
        });

      if (error) {
        console.log(`  ❌ Erro: ${error.message}\n`);
        continue;
      }

      if (!files || files.length === 0) {
        console.log(`  ⚠️  Bucket vazio\n`);
        continue;
      }

      console.log(`  ✅ ${files.length} itens encontrados`);

      // Listar subpastas também
      const folders = files.filter(f => !f.name.includes('.'));
      const directFiles = files.filter(f => f.name.includes('.'));

      console.log(`     ${folders.length} pastas, ${directFiles.length} arquivos diretos`);

      // Verificar cada pasta (se houver)
      let allFiles = [...directFiles];

      for (const folder of folders.slice(0, 100)) { // Limitar a 100 pastas para não demorar muito
        const { data: folderFiles } = await supabase.storage
          .from(bucketName)
          .list(folder.name, { limit: 1000 });

        if (folderFiles && folderFiles.length > 0) {
          allFiles.push(...folderFiles.map(f => ({
            ...f,
            name: `${folder.name}/${f.name}`
          })));
        }
      }

      console.log(`     Total de arquivos (incluindo subpastas): ${allFiles.length}\n`);
      totalFilesFound += allFiles.length;

      // Verificar se algum arquivo pertence aos contractors
      for (const contractor of contractors) {
        const emailPrefix = contractor.email.split('@')[0];

        const contractorFiles = allFiles.filter(file => {
          const fileName = file.name.toLowerCase();
          return (
            fileName.includes(contractor.clerk_id?.toLowerCase() || 'xxx') ||
            fileName.includes(contractor.id?.toLowerCase() || 'xxx') ||
            fileName.includes(emailPrefix.toLowerCase())
          );
        });

        if (contractorFiles.length > 0) {
          const existing = contractorsWithDocuments.find(c => c.email === contractor.email);
          if (existing) {
            existing.files.push(...contractorFiles.map(f => ({
              bucket: bucketName,
              file: f.name,
              size: f.metadata?.size || 0
            })));
            existing.totalFiles = existing.files.length;
          } else {
            contractorsWithDocuments.push({
              email: contractor.email,
              full_name: contractor.full_name,
              clerk_id: contractor.clerk_id,
              user_id: contractor.id,
              created_at: contractor.created_at,
              files: contractorFiles.map(f => ({
                bucket: bucketName,
                file: f.name,
                size: f.metadata?.size || 0
              })),
              totalFiles: contractorFiles.length
            });
          }
        }
      }
    }

    console.log('==================================================\n');
    console.log('📊 RESULTADO FINAL:\n');
    console.log(`Total de arquivos no storage: ${totalFilesFound}`);
    console.log(`Contractors com documentos: ${contractorsWithDocuments.length} de ${contractors.length}\n`);

    if (contractorsWithDocuments.length > 0) {
      // Ordenar por quantidade de arquivos
      contractorsWithDocuments.sort((a, b) => b.totalFiles - a.totalFiles);

      console.log(`\n🎯 CONTRACTORS QUE DEVERIAM SER PROFISSIONAIS:\n`);
      console.log(`Esses ${contractorsWithDocuments.length} contractors têm documentos no storage,`);
      console.log(`indicando que tentaram se cadastrar como profissionais.\n`);

      console.log('Primeiros 30:\n');
      contractorsWithDocuments.slice(0, 30).forEach((c, i) => {
        console.log(`${i + 1}. ${c.full_name || 'Sem nome'} (${c.email})`);
        console.log(`   Arquivos: ${c.totalFiles}`);
        console.log(`   Clerk ID: ${c.clerk_id}`);
        c.files.slice(0, 2).forEach(f => {
          console.log(`   - ${f.bucket}/${f.file}`);
        });
        console.log('');
      });

      // Salvar lista completa
      const fs = require('fs');
      fs.writeFileSync(
        'contractors-with-documents.json',
        JSON.stringify(contractorsWithDocuments, null, 2)
      );
      console.log('💾 Lista completa salva em: contractors-with-documents.json\n');

      // Estatísticas
      const totalDocsCount = contractorsWithDocuments.reduce((sum, c) => sum + c.totalFiles, 0);
      const avgDocs = (totalDocsCount / contractorsWithDocuments.length).toFixed(1);

      console.log('📈 ESTATÍSTICAS:\n');
      console.log(`Total de documentos: ${totalDocsCount}`);
      console.log(`Média de documentos por contractor: ${avgDocs}`);
      console.log(`Contractor com mais documentos: ${contractorsWithDocuments[0]?.full_name} (${contractorsWithDocuments[0]?.totalFiles} arquivos)`);
      console.log('');

      console.log('💡 RECOMENDAÇÃO:\n');
      console.log(`Esses ${contractorsWithDocuments.length} contractors deveriam ter user_type='professional'`);
      console.log(`pois enviaram documentos de cadastro profissional.\n`);

    } else {
      console.log('✅ Nenhum contractor tem documentos no storage.\n');
      console.log('Isso significa que os 133 contractors são realmente clientes!\n');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error(error);
  }
}

checkContractorsWithDocuments();
