require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixConstraint() {
  console.log('🔧 CORRIGINDO CONSTRAINT DE ROLE\n');
  console.log('==================================================\n');

  try {
    // Executar SQL direto via API (se tiver permissão)
    // Como não temos RPC execute_sql, vou tentar outra abordagem

    console.log('❌ PROBLEMA IDENTIFICADO:\n');
    console.log('A constraint "users_role_check" só aceita: [\'user\', \'admin\']\n');
    console.log('PRECISA aceitar: [\'user\', \'admin\', \'professional\', \'supplier\', \'client\']\n');

    console.log('==================================================\n');
    console.log('📋 VOCÊ PRECISA EXECUTAR ESTE SQL NO SUPABASE:\n');
    console.log('==================================================\n');

    const sql = `-- 1. Remover constraint antiga
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- 2. Adicionar nova constraint com todos os roles
ALTER TABLE users
  ADD CONSTRAINT users_role_check
  CHECK (role::text = ANY (ARRAY[
    'user'::character varying,
    'admin'::character varying,
    'professional'::character varying,
    'supplier'::character varying,
    'client'::character varying
  ]::text[]));

-- 3. Verificar que funcionou
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'users_role_check';`;

    console.log(sql);
    console.log('\n==================================================\n');
    console.log('📍 COMO EXECUTAR:\n');
    console.log('1. Acesse: https://supabase.com/dashboard');
    console.log('2. Vá em: SQL Editor');
    console.log('3. Cole o SQL acima');
    console.log('4. Clique em RUN');
    console.log('5. Depois execute: node scripts/migrate-roles.js\n');

  } catch (error) {
    console.error('Erro:', error);
  }
}

fixConstraint();
