require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function migrateContractorsToProfessionals() {
  console.log('\n=== MIGRANDO CONTRACTORS PARA PROFESSIONALS ===\n');

  // 1. Ler lista de contractors com documentos
  if (!fs.existsSync('contractors-with-documents.json')) {
    console.log('❌ Arquivo contractors-with-documents.json não encontrado!');
    console.log('Execute primeiro: node check-contractors-with-documents.js\n');
    return;
  }

  const contractorsWithDocs = JSON.parse(
    fs.readFileSync('contractors-with-documents.json', 'utf8')
  );

  console.log(`📊 Total de contractors a migrar: ${contractorsWithDocs.length}\n`);

  let migrated = 0;
  let profilesCreated = 0;
  let errors = 0;

  const results = [];

  for (const contractor of contractorsWithDocs) {
    console.log(`\n🔄 Processando: ${contractor.full_name || 'Sem nome'} (${contractor.email})`);

    try {
      // PASSO 1: Atualizar user_type para 'professional'
      const { error: updateError } = await supabase
        .from('users')
        .update({ user_type: 'professional' })
        .eq('id', contractor.user_id);

      if (updateError) {
        console.log(`   ❌ Erro ao atualizar user_type: ${updateError.message}`);
        errors++;
        results.push({
          email: contractor.email,
          status: 'error',
          step: 'update_user_type',
          error: updateError.message
        });
        continue;
      }

      console.log(`   ✅ user_type atualizado para 'professional'`);
      migrated++;

      // PASSO 2: Verificar se já tem perfil professional
      const { data: existingProfile } = await supabase
        .from('professionals')
        .select('id, status')
        .eq('user_id', contractor.user_id)
        .single();

      if (existingProfile) {
        console.log(`   ⚠️  Já tem perfil professional (${existingProfile.status})`);
        results.push({
          email: contractor.email,
          status: 'migrated',
          profile_existed: true,
          profile_id: existingProfile.id,
          profile_status: existingProfile.status
        });
        continue;
      }

      // PASSO 3: Criar perfil professional
      console.log(`   📝 Criando perfil professional...`);

      // Gerar CPF e phone placeholder únicos baseados no user_id
      const placeholderCPF = `000.000.${contractor.user_id.substring(0, 3)}-${contractor.user_id.substring(3, 5)}`;
      const placeholderPhone = `(00) 00000-0000`; // Phone placeholder - será atualizado pelo profissional

      const { data: newProfile, error: profileError } = await supabase
        .from('professionals')
        .insert({
          user_id: contractor.user_id,
          clerk_id: contractor.clerk_id,
          email: contractor.email,
          full_name: contractor.full_name || 'Nome não informado',
          phone: placeholderPhone,
          cpf: placeholderCPF, // CPF placeholder único - será atualizado pelo profissional
          birth_date: '2000-01-01', // Data placeholder - será atualizada pelo profissional
          categories: ['Outros'], // Categoria placeholder - será atualizada na revisão
          availability: {
            weekdays: true,
            weekends: false,
            holidays: false,
            night: false,
            travel: false
          },
          status: 'pending', // Começa como pending para revisão
          created_at: contractor.created_at,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (profileError) {
        console.log(`   ❌ Erro ao criar perfil: ${profileError.message}`);
        errors++;
        results.push({
          email: contractor.email,
          status: 'error',
          step: 'create_profile',
          error: profileError.message
        });
        continue;
      }

      console.log(`   ✅ Perfil professional criado! ID: ${newProfile.id}`);
      profilesCreated++;

      // PASSO 4: Tentar linkar documentos do storage
      console.log(`   📎 Linkando ${contractor.totalFiles} documentos...`);

      let docsLinked = 0;

      for (const file of contractor.files) {
        // Extrair tipo de documento do nome do arquivo
        const fileName = file.file.toLowerCase();
        let docType = null;

        if (fileName.includes('cpf')) docType = 'cpf';
        else if (fileName.includes('rg')) docType = 'rg';
        else if (fileName.includes('cnv') || fileName.includes('cnh')) docType = 'cnh';
        else if (fileName.includes('proof') || fileName.includes('comprovante')) docType = 'proof_of_address';
        else if (fileName.includes('portfolio')) docType = 'portfolio';

        if (!docType) continue; // Ignorar arquivos que não conseguimos identificar

        // Criar entrada em document_validations
        const { error: docError } = await supabase
          .from('document_validations')
          .insert({
            professional_id: newProfile.id,
            document_type: docType,
            document_url: `${file.bucket}/${file.file}`,
            status: 'pending', // Precisa revisão
            version: 1,
            uploaded_at: new Date().toISOString()
          });

        if (!docError) {
          docsLinked++;
        }
      }

      console.log(`   ✅ ${docsLinked} documentos linkados`);

      results.push({
        email: contractor.email,
        status: 'success',
        profile_id: newProfile.id,
        profile_status: 'pending',
        documents_linked: docsLinked,
        total_files: contractor.totalFiles
      });

    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}`);
      errors++;
      results.push({
        email: contractor.email,
        status: 'error',
        step: 'unknown',
        error: error.message
      });
    }
  }

  // Salvar relatório
  console.log('\n=== RELATÓRIO FINAL ===\n');
  console.log(`✅ Users migrados (user_type): ${migrated}`);
  console.log(`✅ Perfis criados: ${profilesCreated}`);
  console.log(`❌ Erros: ${errors}\n`);

  fs.writeFileSync(
    'migration-report.json',
    JSON.stringify(results, null, 2)
  );
  console.log('💾 Relatório completo salvo em: migration-report.json\n');

  // Estatísticas finais
  console.log('📊 VERIFICAÇÃO FINAL:\n');

  const { count: totalProf } = await supabase
    .from('professionals')
    .select('*', { count: 'exact', head: true });

  const { count: profUsers } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('user_type', 'professional');

  const { count: contractors } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('user_type', 'contractor');

  console.log(`Total de profissionais (tabela): ${totalProf}`);
  console.log(`Total de users (user_type=professional): ${profUsers}`);
  console.log(`Total de contractors restantes: ${contractors}\n`);

  if (totalProf === profUsers) {
    console.log('✅ PERFEITO! Números batendo!\n');
  }

  // Profissionais pendentes de revisão
  const { count: pending } = await supabase
    .from('professionals')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  console.log(`⚠️  Profissionais pendentes de revisão: ${pending}\n`);

  console.log('📝 PRÓXIMOS PASSOS:\n');
  console.log('1. Revisar os profissionais com status=pending');
  console.log('2. Aprovar/rejeitar baseado nos documentos');
  console.log('3. Contractors restantes são clientes reais\n');
}

migrateContractorsToProfessionals().catch(console.error);
