require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { Clerk } = require('@clerk/clerk-sdk-node');
const fs = require('fs');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const clerk = new Clerk({ secretKey: process.env.CLERK_SECRET_KEY });

async function fixIncompleteProfessionals() {
  console.log('🔧 CORRIGINDO PROFISSIONAIS INCOMPLETOS\n');
  console.log('==================================================\n');

  try {
    // Ler arquivo com usuários que têm documentos
    const clientsWithDocs = JSON.parse(
      fs.readFileSync('clients-with-documents.json', 'utf8')
    );

    // Filtrar apenas os que têm email (remover o vazio)
    const validClients = clientsWithDocs.filter(c => c.email && c.email.length > 0);

    console.log(`📊 Total de profissionais incompletos: ${validClients.length}\n`);
    console.log('Esses usuários TÊM documentos no storage mas NÃO completaram o cadastro.\n');

    // Criar backup
    console.log('📦 Criando backup...\n');
    const { data: backupData } = await supabase
      .from('users')
      .select('*')
      .in('clerk_id', validClients.map(c => c.clerk_id));

    fs.writeFileSync(
      'backup-incomplete-professionals.json',
      JSON.stringify(backupData, null, 2)
    );
    console.log('✅ Backup salvo em: backup-incomplete-professionals.json\n');

    // Atualizar role no Supabase
    console.log('🔄 Passo 1: Atualizando role no Supabase...\n');

    const { error: updateError } = await supabase
      .from('users')
      .update({ role: 'professional' })
      .in('clerk_id', validClients.map(c => c.clerk_id));

    if (updateError) throw updateError;

    console.log(`✅ ${validClients.length} usuários atualizados para role='professional' no Supabase\n`);

    // Atualizar userType no Clerk
    console.log('🔄 Passo 2: Sincronizando com Clerk...\n');

    let updated = 0;
    let errors = 0;

    for (const client of validClients) {
      try {
        await clerk.users.updateUser(client.clerk_id, {
          publicMetadata: {
            userType: 'professional',
            role: 'professional',
          }
        });

        console.log(`✅ ${client.email}`);
        updated++;

        // Delay para evitar rate limit
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`❌ Erro ao atualizar ${client.email}: ${error.message}`);
        errors++;
      }
    }

    console.log('\n==================================================\n');
    console.log('📊 RESUMO DA CORREÇÃO:\n');
    console.log(`✅ Atualizados no Supabase: ${validClients.length}`);
    console.log(`✅ Sincronizados com Clerk: ${updated}`);
    console.log(`❌ Erros: ${errors}\n`);

    // Verificação final
    const { data: afterUpdate } = await supabase
      .from('users')
      .select('role')
      .eq('role', 'professional');

    console.log(`📊 Total de profissionais após correção: ${afterUpdate?.length || 0}\n`);
    console.log('==================================================\n');
    console.log('🎉 CORREÇÃO CONCLUÍDA!\n');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error(error);
  }
}

fixIncompleteProfessionals();
