/**
 * Script de Sincronização Clerk → Supabase
 *
 * Este script:
 * 1. Busca todos os usuários do Clerk
 * 2. Verifica quais já existem no Supabase
 * 3. Insere os usuários que estão faltando
 * 4. Gera relatório detalhado
 *
 * Uso:
 *   npx tsx scripts/sync-users.ts
 */

import { config } from 'dotenv';
import { join } from 'path';

// Carregar .env.local
config({ path: join(process.cwd(), '.env.local') });

interface ClerkUser {
  id: string;
  email_addresses: Array<{
    email_address: string;
    id: string;
  }>;
  first_name: string | null;
  last_name: string | null;
  image_url: string;
  public_metadata: {
    userType?: 'professional' | 'contractor';
    onboardingCompleted?: boolean;
  };
}

async function syncUsers() {
  console.log('🔄 Iniciando sincronização Clerk → Supabase\n');

  // Validar variáveis de ambiente
  const requiredEnvVars = [
    'CLERK_SECRET_KEY',
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
  ];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      console.error(`❌ Variável de ambiente ${envVar} não encontrada`);
      process.exit(1);
    }
  }

  // Importar dinamicamente para evitar erros antes de carregar .env
  const { createClient } = await import('@supabase/supabase-js');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // 1. Buscar todos os usuários do Clerk
    console.log('📡 Buscando usuários do Clerk...');

    let allClerkUsers: ClerkUser[] = [];
    let offset = 0;
    const limit = 100;
    let hasMore = true;

    while (hasMore) {
      const response = await fetch(
        `https://api.clerk.com/v1/users?limit=${limit}&offset=${offset}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Erro ao buscar usuários do Clerk: ${response.statusText}`);
      }

      const users: ClerkUser[] = await response.json();
      allClerkUsers = [...allClerkUsers, ...users];

      console.log(`  ✓ Carregados ${allClerkUsers.length} usuários...`);

      if (users.length < limit) {
        hasMore = false;
      } else {
        offset += limit;
      }
    }

    console.log(`✅ Total de usuários no Clerk: ${allClerkUsers.length}\n`);

    // 2. Buscar usuários existentes no Supabase
    console.log('📊 Verificando usuários no Supabase...');
    const { data: existingUsers, error: fetchError } = await supabase
      .from('users')
      .select('clerk_id');

    if (fetchError) {
      throw new Error(`Erro ao buscar usuários do Supabase: ${fetchError.message}`);
    }

    const existingClerkIds = new Set(
      (existingUsers || []).map((u) => u.clerk_id)
    );
    console.log(`✅ Usuários já no Supabase: ${existingClerkIds.size}\n`);

    // 3. Identificar usuários faltando
    const missingUsers = allClerkUsers.filter(
      (user) => !existingClerkIds.has(user.id)
    );

    console.log(`🔍 Usuários para sincronizar: ${missingUsers.length}\n`);

    if (missingUsers.length === 0) {
      console.log('✅ Todos os usuários já estão sincronizados!');
      return;
    }

    // 4. Inserir usuários faltando
    console.log('💾 Inserindo usuários no Supabase...\n');

    let successCount = 0;
    let errorCount = 0;
    const errors: Array<{ user: string; error: string }> = [];

    for (const user of missingUsers) {
      const email = user.email_addresses[0]?.email_address || '';
      const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || null;

      try {
        const { error } = await supabase.from('users').insert({
          clerk_id: user.id,
          email,
          full_name: fullName,
          avatar_url: user.image_url || null,
          user_type: user.public_metadata?.userType || null,
          status: 'active',
        });

        if (error) {
          throw error;
        }

        successCount++;
        console.log(`  ✅ ${email}`);
      } catch (error: any) {
        errorCount++;
        console.log(`  ❌ ${email} - ${error.message}`);
        errors.push({
          user: email,
          error: error.message,
        });
      }
    }

    // 5. Relatório final
    console.log('\n' + '='.repeat(60));
    console.log('📊 RELATÓRIO DE SINCRONIZAÇÃO');
    console.log('='.repeat(60));
    console.log(`Total no Clerk:           ${allClerkUsers.length}`);
    console.log(`Já existiam no Supabase:  ${existingClerkIds.size}`);
    console.log(`Precisavam sincronizar:   ${missingUsers.length}`);
    console.log(`✅ Sincronizados:          ${successCount}`);
    console.log(`❌ Erros:                  ${errorCount}`);
    console.log('='.repeat(60));

    if (errors.length > 0) {
      console.log('\n❌ ERROS DETALHADOS:');
      errors.forEach(({ user, error }) => {
        console.log(`  • ${user}: ${error}`);
      });
    }

    console.log('\n✅ Sincronização concluída!');
  } catch (error: any) {
    console.error('\n❌ Erro durante a sincronização:', error.message);
    process.exit(1);
  }
}

// Executar
syncUsers();
