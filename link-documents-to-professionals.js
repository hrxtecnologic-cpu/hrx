require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function linkDocuments() {
  console.log('\n=== LINKANDO DOCUMENTOS AOS PERFIS PROFISSIONAIS ===\n');

  // Ler lista de contractors com documentos
  if (!fs.existsSync('contractors-with-documents.json')) {
    console.log('❌ Arquivo contractors-with-documents.json não encontrado!');
    return;
  }

  const contractorsWithDocs = JSON.parse(
    fs.readFileSync('contractors-with-documents.json', 'utf8')
  );

  console.log(`📊 Total de contractors com documentos: ${contractorsWithDocs.length}\n`);

  let totalLinked = 0;
  let totalProcessed = 0;

  for (const contractor of contractorsWithDocs) {
    console.log(`\n🔄 Processando: ${contractor.full_name || 'Sem nome'} (${contractor.email || 'sem email'})`);

    // Buscar o perfil professional deste contractor
    const { data: professional } = await supabase
      .from('professionals')
      .select('id, full_name, email')
      .eq('user_id', contractor.user_id)
      .single();

    if (!professional) {
      console.log(`   ⚠️  Não tem perfil professional`);
      continue;
    }

    console.log(`   ✅ Perfil encontrado: ${professional.id}`);
    console.log(`   📎 Linkando ${contractor.files.length} documentos...`);

    let docsLinked = 0;
    const docDetails = [];

    for (const file of contractor.files) {
      const fileName = file.file.toLowerCase();
      let docType = null;

      // Detectar tipo de documento do nome do arquivo
      if (fileName.includes('cpf')) {
        docType = 'cpf';
      } else if (fileName.includes('rg_front') || fileName.includes('rg front')) {
        docType = 'rg_front';
      } else if (fileName.includes('rg_back') || fileName.includes('rg back')) {
        docType = 'rg_back';
      } else if (fileName.includes('rg') && !fileName.includes('_')) {
        docType = 'rg_front'; // RG sem especificação assume frente
      } else if (fileName.includes('cnv') || fileName.includes('cnh')) {
        docType = 'cnh';
      } else if (fileName.includes('proof') || fileName.includes('comprovante') || fileName.includes('address')) {
        docType = 'proof_of_address';
      } else if (fileName.includes('portfolio')) {
        docType = 'portfolio';
      }

      if (!docType) {
        console.log(`   ⚠️  Arquivo ignorado (tipo não identificado): ${file.file}`);
        continue;
      }

      // Verificar se já existe um documento deste tipo para este professional
      const { data: existing } = await supabase
        .from('document_validations')
        .select('id')
        .eq('professional_id', professional.id)
        .eq('document_type', docType)
        .eq('document_url', `${file.bucket}/${file.file}`)
        .single();

      if (existing) {
        console.log(`   ⏭️  Já existe: ${docType}`);
        continue;
      }

      // Criar entrada em document_validations
      const { error: docError } = await supabase
        .from('document_validations')
        .insert({
          professional_id: professional.id,
          document_type: docType,
          document_url: `${file.bucket}/${file.file}`,
          status: 'pending',
          version: 1
        });

      if (docError) {
        console.log(`   ❌ Erro ao linkar ${docType}: ${docError.message}`);
      } else {
        docsLinked++;
        docDetails.push(docType);
      }
    }

    if (docsLinked > 0) {
      console.log(`   ✅ ${docsLinked} documentos linkados: ${docDetails.join(', ')}`);
      totalLinked += docsLinked;
      totalProcessed++;
    } else {
      console.log(`   ⚠️  0 documentos linkados`);
    }
  }

  console.log('\n=== RESULTADO FINAL ===\n');
  console.log(`Profissionais processados: ${totalProcessed}`);
  console.log(`Total de documentos linkados: ${totalLinked}\n`);
}

linkDocuments().catch(console.error);
