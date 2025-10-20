/**
 * Script de migração única para atualizar solicitações antigas
 *
 * Este script vincula solicitações antigas (sem clerk_id) aos usuários
 * baseado no email da solicitação.
 *
 * Execute: node scripts/migrate-requests.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Ler .env.local manualmente
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};

envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    env[match[1].trim()] = match[2].trim();
  }
});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

async function migrateRequests() {
  console.log('🔄 Iniciando migração de solicitações antigas...\n');

  try {
    // 1. Buscar todas as solicitações sem clerk_id
    const { data: requestsWithoutClerkId, error: fetchError } = await supabase
      .from('contractor_requests')
      .select('id, email')
      .is('clerk_id', null);

    if (fetchError) {
      throw new Error(`Erro ao buscar solicitações: ${fetchError.message}`);
    }

    if (!requestsWithoutClerkId || requestsWithoutClerkId.length === 0) {
      console.log('✅ Nenhuma solicitação antiga para migrar!');
      return;
    }

    console.log(`📋 Encontradas ${requestsWithoutClerkId.length} solicitações sem clerk_id\n`);

    let updated = 0;
    let notFound = 0;

    // 2. Para cada solicitação, buscar usuário pelo email
    for (const request of requestsWithoutClerkId) {
      console.log(`🔍 Processando: ${request.email}`);

      // Buscar usuário no Clerk pelo email
      const { data: users, error: userError } = await supabase
        .from('users')
        .select('clerk_id')
        .eq('email', request.email)
        .limit(1);

      if (userError) {
        console.log(`   ⚠️  Erro ao buscar usuário: ${userError.message}`);
        continue;
      }

      if (!users || users.length === 0) {
        console.log(`   ℹ️  Usuário não encontrado (solicitação pública)`);
        notFound++;
        continue;
      }

      const clerkId = users[0].clerk_id;

      // Atualizar solicitação com clerk_id
      const { error: updateError } = await supabase
        .from('contractor_requests')
        .update({ clerk_id: clerkId })
        .eq('id', request.id);

      if (updateError) {
        console.log(`   ❌ Erro ao atualizar: ${updateError.message}`);
        continue;
      }

      console.log(`   ✅ Vinculada ao usuário ${clerkId}`);
      updated++;
    }

    console.log('\n📊 Resumo da migração:');
    console.log(`   ✅ Atualizadas: ${updated}`);
    console.log(`   ℹ️  Sem usuário: ${notFound}`);
    console.log(`   📋 Total: ${requestsWithoutClerkId.length}`);
    console.log('\n✨ Migração concluída!\n');

  } catch (error) {
    console.error('\n❌ Erro durante migração:', error.message);
    process.exit(1);
  }
}

// Executar migração
migrateRequests();
