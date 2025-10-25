const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://waplbfawlcavwtvfwprf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhcGxiZmF3bGNhdnd0dmZ3cHJmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDg4MDE2MSwiZXhwIjoyMDc2NDU2MTYxfQ.4f_wtj8epcr-39D3LX71Tw4TmalNRVJQPMxdOL689Yk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEmails() {
  console.log('\n=== VERIFICANDO EMAILS DOS PROFISSIONAIS ===\n');

  const { data: professionals, error } = await supabase
    .from('professionals')
    .select('id, full_name, email, clerk_id, user_id, status, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Erro:', error);
    return;
  }

  console.log(`📊 Total de profissionais: ${professionals.length}\n`);

  // Agrupar por email
  const emailGroups = {};
  professionals.forEach(p => {
    if (!emailGroups[p.email]) {
      emailGroups[p.email] = [];
    }
    emailGroups[p.email].push(p);
  });

  // Mostrar emails com múltiplos profissionais
  console.log('📧 EMAILS COM MÚLTIPLOS PROFISSIONAIS:\n');
  const duplicates = Object.entries(emailGroups).filter(([email, profs]) => profs.length > 1);

  if (duplicates.length > 0) {
    duplicates.forEach(([email, profs]) => {
      console.log(`   ${email} (${profs.length} profissionais):`);
      profs.forEach(p => {
        console.log(`      - ${p.full_name} | Status: ${p.status} | clerk_id: ${p.clerk_id ? '✓' : '✗'} | user_id: ${p.user_id ? '✓' : '✗'}`);
      });
      console.log('');
    });
  } else {
    console.log('   ✅ Nenhum email duplicado!\n');
  }

  // Listar todos os emails únicos
  console.log('📧 TODOS OS EMAILS ÚNICOS:\n');
  const uniqueEmails = Object.keys(emailGroups).sort();
  uniqueEmails.forEach((email, index) => {
    const count = emailGroups[email].length;
    const suffix = count > 1 ? ` (${count} profissionais)` : '';
    console.log(`   ${index + 1}. ${email}${suffix}`);
  });

  console.log(`\n📊 Total de emails únicos: ${uniqueEmails.length}`);

  // Estatísticas
  console.log('\n=== ESTATÍSTICAS ===');
  console.log(`Total de profissionais: ${professionals.length}`);
  console.log(`Emails únicos: ${uniqueEmails.length}`);
  console.log(`Com clerk_id: ${professionals.filter(p => p.clerk_id).length}`);
  console.log(`Com user_id: ${professionals.filter(p => p.user_id).length}`);
  console.log(`Órfãos (sem user_id): ${professionals.filter(p => !p.user_id).length}`);
  console.log('===================\n');
}

checkEmails().catch(console.error);
