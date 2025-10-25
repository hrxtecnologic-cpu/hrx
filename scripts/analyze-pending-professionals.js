require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function analyzePendingProfessionals() {
  console.log('🔍 ANALISANDO PROFISSIONAIS PENDENTES\n');
  console.log('==================================================\n');

  try {
    // Ler os usuários com documentos
    const clientsWithDocs = JSON.parse(
      fs.readFileSync('clients-with-documents.json', 'utf8')
    );

    const validClients = clientsWithDocs.filter(c => c.email && c.email.length > 0);

    console.log(`📊 Total de usuários com documentos: ${validClients.length}\n`);

    let withRecord = 0;
    let withoutRecord = 0;
    let byStatus = {};
    let details = [];

    for (const client of validClients) {
      const { data: user } = await supabase
        .from('users')
        .select('id, email, role')
        .eq('clerk_id', client.clerk_id)
        .single();

      if (!user) continue;

      const { data: professional } = await supabase
        .from('professionals')
        .select('id, status, email, full_name')
        .eq('user_id', user.id)
        .single();

      if (professional) {
        withRecord++;
        byStatus[professional.status || 'null'] = (byStatus[professional.status || 'null'] || 0) + 1;
        details.push({
          email: user.email,
          status: professional.status,
          current_role: user.role
        });
      } else {
        withoutRecord++;
        console.log(`❌ SEM REGISTRO: ${user.email} (tem documentos mas não está na tabela professionals)`);
      }
    }

    console.log('\n==================================================\n');
    console.log('📊 RESULTADO:\n');
    console.log(`Com registro na tabela professionals: ${withRecord}`);
    console.log(`Sem registro na tabela professionals: ${withoutRecord}\n`);

    if (Object.keys(byStatus).length > 0) {
      console.log('Status dos profissionais:');
      Object.entries(byStatus).forEach(([status, count]) => {
        console.log(`  ${status}: ${count}`);
      });
      console.log('');
    }

    if (details.length > 0) {
      console.log('Detalhes (primeiros 20):\n');
      details.slice(0, 20).forEach((d, i) => {
        console.log(`${i + 1}. ${d.email}`);
        console.log(`   Status: ${d.status}, Role atual: ${d.current_role}`);
      });
    }

    console.log('\n==================================================\n');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error(error);
  }
}

analyzePendingProfessionals();
