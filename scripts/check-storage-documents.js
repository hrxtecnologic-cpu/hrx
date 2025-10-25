require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkStorageDocuments() {
  console.log('🔍 VERIFICANDO DOCUMENTOS NO STORAGE DO SUPABASE\n');
  console.log('==================================================\n');

  try {
    // 1. Listar todos os buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

    if (bucketsError) throw bucketsError;

    console.log('📦 Buckets disponíveis:\n');
    buckets.forEach(bucket => {
      console.log(`  - ${bucket.name} (${bucket.public ? 'público' : 'privado'})`);
    });
    console.log('');

    // 2. Buscar usuários com role=client
    const { data: clients } = await supabase
      .from('users')
      .select('id, clerk_id, email, role')
      .eq('role', 'client');

    console.log(`📊 Total de usuários com role='client': ${clients.length}\n`);

    // 3. Verificar documentos em cada bucket relevante
    const documentBuckets = ['professional-documents', 'documents', 'uploads', 'professionals'];

    let clientsWithDocuments = [];

    for (const bucketName of documentBuckets) {
      console.log(`🔍 Verificando bucket: ${bucketName}...`);

      const { data: files, error } = await supabase.storage
        .from(bucketName)
        .list('', {
          limit: 1000,
          sortBy: { column: 'name', order: 'asc' }
        });

      if (error) {
        console.log(`  ❌ Erro ao acessar bucket ${bucketName}: ${error.message}\n`);
        continue;
      }

      if (!files || files.length === 0) {
        console.log(`  ⚠️  Bucket vazio\n`);
        continue;
      }

      console.log(`  ✅ ${files.length} arquivos encontrados\n`);

      // Verificar se algum arquivo pertence aos clients
      for (const client of clients) {
        const clientFiles = files.filter(file =>
          file.name.includes(client.clerk_id) ||
          file.name.includes(client.id) ||
          file.name.includes(client.email.split('@')[0])
        );

        if (clientFiles.length > 0) {
          const existing = clientsWithDocuments.find(c => c.email === client.email);
          if (existing) {
            existing.files.push(...clientFiles.map(f => ({ bucket: bucketName, file: f.name })));
          } else {
            clientsWithDocuments.push({
              email: client.email,
              clerk_id: client.clerk_id,
              files: clientFiles.map(f => ({ bucket: bucketName, file: f.name }))
            });
          }
        }
      }
    }

    console.log('==================================================\n');
    console.log('📊 RESULTADO:\n');
    console.log(`Total de clients com documentos no storage: ${clientsWithDocuments.length}\n`);

    if (clientsWithDocuments.length > 0) {
      console.log('Primeiros 20 usuários com documentos:\n');
      clientsWithDocuments.slice(0, 20).forEach((client, i) => {
        console.log(`${i + 1}. ${client.email}`);
        console.log(`   Arquivos: ${client.files.length}`);
        client.files.slice(0, 3).forEach(f => {
          console.log(`   - ${f.bucket}/${f.file}`);
        });
        console.log('');
      });

      // Salvar resultado completo
      const fs = require('fs');
      fs.writeFileSync(
        'clients-with-documents.json',
        JSON.stringify(clientsWithDocuments, null, 2)
      );
      console.log('💾 Lista completa salva em: clients-with-documents.json\n');
    } else {
      console.log('⚠️  Nenhum client tem documentos no storage.\n');
      console.log('Isso pode significar que:\n');
      console.log('1. Os documentos estão organizados de outra forma\n');
      console.log('2. Os buckets têm nomes diferentes\n');
      console.log('3. Os 134 clients são realmente clientes (não profissionais incompletos)\n');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error(error);
  }
}

checkStorageDocuments();
