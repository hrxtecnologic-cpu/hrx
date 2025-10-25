require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  const { data } = await supabase
    .from('users')
    .select('clerk_id, email')
    .limit(10);

  console.log('Exemplos de clerk_id no Supabase:\n');
  data?.forEach(u => {
    console.log(`Email: ${u.email}`);
    console.log(`clerk_id: ${u.clerk_id}`);
    console.log(`Tamanho: ${u.clerk_id?.length || 0}`);
    console.log('---');
  });
})();
