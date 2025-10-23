import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

console.log('='.repeat(70));
console.log('📧 TESTANDO ENVIO DE PROPOSTA PARA erickrussomat@gmail.com');
console.log('='.repeat(70));

async function enviarProposta() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // 1. Buscar projeto mais recente
  console.log('\n📋 [1/2] Buscando projeto de teste...');

  const { data: projetos, error } = await supabase
    .from('event_projects')
    .select('id, project_number, client_name, client_email')
    .order('created_at', { ascending: false })
    .limit(1);

  if (error || !projetos || projetos.length === 0) {
    console.error('❌ Erro:', error?.message);
    return;
  }

  const projeto = projetos[0];
  console.log(`✅ Projeto: ${projeto.project_number}`);
  console.log(`   Cliente: ${projeto.client_name}`);
  console.log(`   Email: ${projeto.client_email}\n`);

  // 2. Fazer chamada à API
  console.log('📧 [2/2] Enviando proposta via API...');

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const url = `${baseUrl}/api/admin/event-projects/${projeto.id}/send-proposal`;

  console.log(`   URL: ${url}`);
  console.log(`   Método: POST\n`);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Nota: Em produção precisaria do token de autenticação do Clerk
        // Para teste local, vamos assumir que está autenticado
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Erro na API:', data.error);
      console.error('   Status:', response.status);
      if (response.status === 401) {
        console.log('\n💡 SOLUÇÃO:');
        console.log('   Este script não pode chamar a API diretamente pois precisa autenticação.');
        console.log('   Para testar o envio de email:');
        console.log(`   1. Acesse: http://localhost:3000/admin/projetos/${projeto.id}`);
        console.log('   2. Clique no botão "Enviar Proposta Final"');
        console.log('   3. Confirme o envio');
        console.log(`   4. Verifique seu email: ${projeto.client_email}`);
      }
      return;
    }

    console.log('✅ PROPOSTA ENVIADA COM SUCESSO!');
    console.log(`   Destinatário: ${data.recipient}`);
    console.log(`   Valor Total: R$ ${data.totalValue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
    console.log(`\n📬 Verifique seu email: ${projeto.client_email}`);

  } catch (error) {
    console.error('❌ Erro ao chamar API:', error.message);
    console.log('\n💡 TESTE MANUAL:');
    console.log(`   1. Acesse: http://localhost:3000/admin/projetos/${projeto.id}`);
    console.log('   2. Faça login como administrador');
    console.log('   3. Clique no botão "Enviar Proposta Final"');
    console.log('   4. Confirme o envio');
    console.log(`   5. Verifique seu email: ${projeto.client_email}`);
  }
}

enviarProposta().catch(console.error);
