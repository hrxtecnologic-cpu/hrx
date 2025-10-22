import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import {
  sendEventRequestClientConfirmation,
  sendEventRequestAdminNotification,
} from '@/lib/resend/emails';

/**
 * API PÚBLICA para receber solicitações de eventos de clientes
 * Endpoint: POST /api/public/event-requests
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      client_name,
      client_email,
      client_phone,
      client_company,
      client_cnpj,
      event_name,
      event_type,
      event_description,
      event_date,
      start_time,
      end_time,
      expected_attendance,
      venue_name,
      venue_address,
      venue_city,
      venue_state,
      venue_zip,
      professionals,
      equipment_types,
      equipment_notes,
      is_urgent,
      budget_range,
      additional_notes,
    } = body;

    // Validações básicas
    if (!client_name || !client_email || !client_phone) {
      return NextResponse.json(
        { error: 'Dados do cliente são obrigatórios (nome, email, telefone)' },
        { status: 400 }
      );
    }

    if (!event_name || !event_type || !event_description) {
      return NextResponse.json(
        { error: 'Dados do evento são obrigatórios (nome, tipo, descrição)' },
        { status: 400 }
      );
    }

    if (!venue_address || !venue_city || !venue_state) {
      return NextResponse.json(
        { error: 'Localização é obrigatória (endereço, cidade, estado)' },
        { status: 400 }
      );
    }

    if (!professionals || professionals.length === 0) {
      return NextResponse.json(
        { error: 'Adicione pelo menos um profissional necessário' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Criar projeto de evento
    const { data: project, error: projectError } = await supabase
      .from('event_projects')
      .insert([
        {
          // Cliente
          client_name,
          client_email,
          client_phone,
          client_company: client_company || null,
          client_cnpj: client_cnpj || null,

          // Evento
          event_name,
          event_type,
          event_description,
          event_date: event_date || null,
          start_time: start_time || null,
          end_time: end_time || null,
          expected_attendance: expected_attendance || null,

          // Localização
          venue_name: venue_name || null,
          venue_address,
          venue_city,
          venue_state,
          venue_zip: venue_zip || null,

          // Status e configurações
          status: 'new',
          is_urgent: is_urgent || false,
          profit_margin: is_urgent ? 80 : 35, // Margem automática baseada na urgência
          budget_range: budget_range || null,
          additional_notes: additional_notes || null,

          // Metadados da solicitação pública
          internal_notes: `Solicitação pública recebida via formulário do site.\n\nProfissionais solicitados: ${JSON.stringify(professionals, null, 2)}\n\nEquipamentos: ${equipment_types?.join(', ') || 'Nenhum'}\n\nObservações sobre equipamentos: ${equipment_notes || 'Nenhuma'}`,
        },
      ])
      .select()
      .single();

    if (projectError) {
      console.error('❌ Erro ao criar projeto:', projectError);
      throw projectError;
    }

    console.log(`✅ Projeto criado: ${project.project_number} - ${event_name}`);

    // Enviar emails em paralelo (não bloqueia a resposta ao cliente)
    Promise.all([
      // Email de confirmação para o cliente
      sendEventRequestClientConfirmation({
        clientName: client_name,
        clientEmail: client_email,
        eventName: event_name,
        eventDate: event_date,
        eventType: event_type,
        venueCity: venue_city,
        venueState: venue_state,
        projectNumber: project.project_number,
        professionalCount: professionals.length,
        equipmentCount: equipment_types?.length || 0,
        isUrgent: is_urgent,
      }),
      // Notificação para admin
      sendEventRequestAdminNotification({
        projectId: project.id,
        projectNumber: project.project_number,
        clientName: client_name,
        clientEmail: client_email,
        clientPhone: client_phone,
        clientCompany: client_company,
        eventName: event_name,
        eventType: event_type,
        eventDate: event_date,
        eventDescription: event_description,
        venueAddress: venue_address,
        venueCity: venue_city,
        venueState: venue_state,
        expectedAttendance: expected_attendance,
        professionals: professionals,
        equipmentTypes: equipment_types || [],
        equipmentNotes: equipment_notes,
        isUrgent: is_urgent,
        budgetRange: budget_range,
        additionalNotes: additional_notes,
      }),
    ])
      .then(([clientResult, adminResult]) => {
        if (clientResult.success) {
          console.log(`✅ Email de confirmação enviado para cliente: ${client_email}`);
        } else {
          console.error(`❌ Erro ao enviar email para cliente: ${clientResult.error}`);
        }

        if (adminResult.success) {
          console.log(`✅ Email de notificação enviado para admin`);
        } else {
          console.error(`❌ Erro ao enviar email para admin: ${adminResult.error}`);
        }
      })
      .catch((error) => {
        console.error('❌ Erro ao enviar emails:', error);
      });

    return NextResponse.json(
      {
        success: true,
        message: 'Solicitação recebida com sucesso!',
        project_number: project.project_number,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('❌ Erro ao processar solicitação:', error);

    // Se for erro de tabela não existir, retornar mensagem amigável
    if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
      return NextResponse.json(
        {
          error:
            'Sistema de projetos ainda não foi configurado. Por favor, execute as migrations do banco de dados.',
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Erro ao processar sua solicitação. Tente novamente mais tarde.' },
      { status: 500 }
    );
  }
}
