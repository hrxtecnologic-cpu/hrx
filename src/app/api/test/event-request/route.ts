import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();

    console.log('\n🧪 [TEST MODE] Solicitação de Evento (sem Clerk)');
    console.log('📦 Tipo:', body.request_type);
    console.log('📦 Dados recebidos:', JSON.stringify(body, null, 2));

    if (body.request_type === 'client') {
      // CLIENTE - Solicitar evento (usando tabela event_projects)
      const eventRequest = {
        // Cliente
        client_name: body.client_name,
        client_email: body.client_email,
        client_phone: body.client_phone,
        client_company: body.client_company || null,
        client_cnpj: body.client_cnpj || null,

        // Evento
        event_name: body.event_name,
        event_type: body.event_type,
        event_description: body.event_description,
        event_date: body.event_date || null,
        start_time: body.start_time || null,
        end_time: body.end_time || null,
        expected_attendance: body.expected_attendance || null,

        // Localização
        venue_name: body.venue_name || null,
        venue_address: body.venue_address,
        venue_city: body.venue_city,
        venue_state: body.venue_state,
        venue_zip: body.venue_zip || null,

        // Profissionais e Equipamentos (usando campos corretos da tabela)
        professionals_needed: body.professionals || [],
        equipment_needed: body.equipment || [],

        // Urgência e Orçamento
        is_urgent: body.is_urgent || false,
        profit_margin: body.is_urgent ? 80 : 35,
        budget_range: body.budget_range || null,

        // Observações
        additional_notes: body.additional_notes || null,
        internal_notes: 'Solicitação de teste via API de desenvolvimento',

        // Status
        status: 'new',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      console.log('🎉 Criando projeto de evento:', eventRequest);

      const { data, error } = await supabase
        .from('event_projects')
        .insert(eventRequest)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao criar evento:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      console.log('✅ Evento criado:', data);
      console.log('\n✅ TESTE CONCLUÍDO COM SUCESSO!');
      console.log(`📊 Event Request ID: ${data.id}`);
      console.log(`📊 Cliente: ${data.client_name}`);
      console.log(`📊 Evento: ${data.event_name}`);
      console.log(`📊 Status: ${data.status}`);

      return NextResponse.json({
        success: true,
        message: 'Solicitação de evento de teste criada com sucesso!',
        data: data,
      });

    } else if (body.request_type === 'supplier') {
      // FORNECEDOR - Cadastro
      const supplier = {
        company_name: body.company_name,
        contact_name: body.contact_name,
        email: body.email,
        phone: body.phone,
        equipment_types: body.equipment_types,
        pricing: body.pricing,
        notes: body.notes,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      console.log('🏢 Criando cadastro de fornecedor:', supplier);

      const { data, error } = await supabase
        .from('equipment_suppliers')
        .insert(supplier)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao criar fornecedor:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      console.log('✅ Fornecedor criado:', data);
      console.log('\n✅ TESTE CONCLUÍDO COM SUCESSO!');
      console.log(`📊 Supplier ID: ${data.id}`);
      console.log(`📊 Empresa: ${data.company_name}`);
      console.log(`📊 Contato: ${data.contact_name}`);
      console.log(`📊 Status: ${data.status}`);

      return NextResponse.json({
        success: true,
        message: 'Cadastro de fornecedor de teste criado com sucesso!',
        data: data,
      });
    }

    return NextResponse.json(
      { error: 'Tipo de requisição inválido' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('❌ Erro no teste:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao processar solicitação de teste' },
      { status: 500 }
    );
  }
}
