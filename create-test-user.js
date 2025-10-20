// Script para criar usuário de teste no Supabase
// Execute: node create-test-user.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTestUser() {
  console.log('🚀 Criando usuário de teste no Supabase...\n');

  const testUser = {
    clerk_id: 'user_34I4cvhLtM7vB44jix7bfu2t4yX',
    email: 'prplshrmp@gmail.com',
    full_name: 'Usuário Teste Playwright',
    user_type: 'professional',
    status: 'active'
  };

  // Verificar se já existe
  const { data: existing } = await supabase
    .from('users')
    .select('id, clerk_id, email')
    .eq('clerk_id', testUser.clerk_id)
    .single();

  if (existing) {
    console.log('✅ Usuário já existe no banco de dados!');
    console.log('📋 Dados:', existing);
    return;
  }

  // Inserir novo usuário
  const { data, error } = await supabase
    .from('users')
    .insert(testUser)
    .select()
    .single();

  if (error) {
    console.error('❌ Erro ao criar usuário:', error);
    process.exit(1);
  }

  console.log('✅ Usuário criado com sucesso!');
  console.log('📋 Dados:', data);
  console.log('\n🎉 Agora você pode executar o teste E2E!');
  console.log('Execute: npx playwright test tests/cadastro-profissional.spec.ts --headed');
}

createTestUser().catch(console.error);
