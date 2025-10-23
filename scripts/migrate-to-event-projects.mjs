import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🚀 MIGRAÇÃO: contractor_requests → event_projects\n');
console.log('================================================================\n');

// 1. Buscar contractor_requests
const { data: contractorRequests, error: fetchError } = await supabase
  .from('contractor_requests')
  .select('*')
  .order('created_at', { ascending: true });

if (fetchError) {
  console.error('❌ Erro ao buscar contractor_requests:', fetchError);
  process.exit(1);
}

console.log(`📊 Encontrados ${contractorRequests.length} registros para migrar\n`);

if (contractorRequests.length === 0) {
  console.log('✅ Nada para migrar!\n');
  process.exit(0);
}

// 2. Gerar próximo número de projeto
const { data: lastProject } = await supabase
  .from('event_projects')
  .select('project_number')
  .order('created_at', { ascending: false })
  .limit(1)
  .single();

let nextNumber = 1;
if (lastProject?.project_number) {
  const match = lastProject.project_number.match(/PRJ-(\d+)/);
  if (match) {
    nextNumber = parseInt(match[1]) + 1;
  }
}

console.log(`🔢 Próximo número de projeto: PRJ-${String(nextNumber).padStart(4, '0')}\n`);
console.log('================================================================\n');

// 3. Migrar cada contractor_request
let successCount = 0;
let errorCount = 0;

for (const req of contractorRequests) {
  const projectNumber = `PRJ-${String(nextNumber).padStart(4, '0')}`;

  console.log(`\n📦 Migrando: ${req.event_name} (${req.company_name})`);
  console.log(`   ID original: ${req.id}`);
  console.log(`   Novo número: ${projectNumber}`);

  try {
    // Mapear campos de contractor_requests para event_projects
    const eventProject = {
      project_number: projectNumber,

      // Dados do cliente
      client_name: req.responsible_name || req.company_name,
      client_email: req.email,
      client_phone: req.phone,
      client_company: req.company_name,
      client_cnpj: req.cnpj,

      // Dados do evento
      event_name: req.event_name,
      event_type: req.event_type,
      event_description: req.event_description,
      event_date: req.start_date,
      expected_attendance: req.expected_attendance,

      // Local do evento
      venue_name: req.venue_name,
      venue_address: req.venue_address,
      venue_city: req.venue_city,
      venue_state: req.venue_state,

      // Configurações
      is_urgent: req.urgency === 'urgent',
      profit_margin: req.urgency === 'urgent' ? 80 : 35,

      // Status
      status: req.status === 'completed' ? 'completed' : 'new',

      // Notas
      additional_notes: req.additional_notes,
      internal_notes: `MIGRADO de contractor_requests\nID original: ${req.id}\nData início: ${req.start_date}\nData fim: ${req.end_date}\nResponsável: ${req.responsible_name} (${req.responsible_role})`,

      // ID de migração para rastreamento
      migrated_from_contractor_request_id: req.id,

      // Timestamps
      created_at: req.created_at,
      updated_at: req.updated_at,
    };

    // Inserir projeto
    const { data: newProject, error: projectError } = await supabase
      .from('event_projects')
      .insert([eventProject])
      .select()
      .single();

    if (projectError) {
      throw new Error(`Erro ao criar projeto: ${projectError.message}`);
    }

    console.log(`   ✅ Projeto criado: ${newProject.id}`);

    // Migrar profissionais necessários para project_team
    if (req.professionals_needed && Array.isArray(req.professionals_needed)) {
      console.log(`   📋 Migrando ${req.professionals_needed.length} profissional(is) necessário(s)...`);

      for (const prof of req.professionals_needed) {
        // Calcular duração em dias
        const startDate = new Date(req.start_date);
        const endDate = new Date(req.end_date);
        const durationDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

        const teamMember = {
          project_id: newProject.id,
          role: prof.category,
          quantity: prof.quantity || 1,
          duration_days: durationDays,
          daily_rate: 0, // Não temos essa informação no contractor_requests
          total_cost: 0,
          requirements: prof.requirements || null,
          status: 'pending',
        };

        const { error: teamError } = await supabase
          .from('project_team')
          .insert([teamMember]);

        if (teamError) {
          console.log(`   ⚠️  Erro ao adicionar profissional ${prof.category}:`, teamError.message);
        } else {
          console.log(`   ✅ Profissional adicionado: ${prof.category} (${prof.quantity}x por ${durationDays} dias)`);
        }
      }
    }

    successCount++;
    nextNumber++;

  } catch (error) {
    console.error(`   ❌ Erro: ${error.message}`);
    errorCount++;
  }
}

console.log('\n================================================================\n');
console.log('📊 RESULTADO DA MIGRAÇÃO:\n');
console.log(`   ✅ Migrados com sucesso: ${successCount}`);
console.log(`   ❌ Erros: ${errorCount}`);
console.log(`   📝 Total processado: ${contractorRequests.length}\n`);

// 4. Verificação final
const { data: migratedProjects } = await supabase
  .from('event_projects')
  .select('id, project_number, event_name')
  .ilike('internal_notes', '%MIGRADO de contractor_requests%');

console.log('🔍 PROJETOS MIGRADOS:\n');
migratedProjects?.forEach(proj => {
  console.log(`   • ${proj.project_number} - ${proj.event_name}`);
});

console.log('\n================================================================\n');
console.log('✅ Migração concluída!\n');
console.log('⚠️  PRÓXIMO PASSO: Revisar os projetos migrados no admin e depois');
console.log('   podemos arquivar/remover a tabela contractor_requests.\n');
