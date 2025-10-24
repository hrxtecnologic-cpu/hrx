import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  sendEventRequestClientConfirmation,
  sendEventRequestAdminNotification,
} from '@/lib/resend/emails';

/**
 * API PÚBLICA para receber:
 * - Solicitações de eventos de clientes (request_type: 'client')
 * - Cadastros de fornecedores (request_type: 'supplier')
 * Endpoint: POST /api/public/event-requests
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { request_type } = body;

    // ========================================
    // FORNECEDOR - Cadastro de empresa fornecedora
    // ========================================
    if (request_type === 'supplier') {
      const {
        company_name,
        contact_name,
        email,
        phone,
        equipment_types,
        pricing,
        notes,
      } = body;

      // Validações
      if (!company_name || !contact_name || !email || !phone) {
        return NextResponse.json(
          { error: 'Dados da empresa são obrigatórios (nome, contato, email, telefone)' },
          { status: 400 }
        );
      }

      if (!equipment_types || equipment_types.length === 0) {
        return NextResponse.json(
          { error: 'Selecione pelo menos um tipo de equipamento que fornece' },
          { status: 400 }
        );
      }

      const supabase = await createClient();

      // Tentar obter userId se usuário estiver autenticado (seguindo padrão profissional)
      let userId: string | null = null;
      try {
        const authResult = await auth();
        userId = authResult.userId;
      } catch {
        // Usuário não autenticado - não deve cadastrar fornecedor sem auth
        return NextResponse.json(
          { error: 'Autenticação necessária para cadastrar como fornecedor' },
          { status: 401 }
        );
      }

      // Verificar se já existe fornecedor com este clerk_id
      const { data: existing } = await supabase
        .from('equipment_suppliers')
        .select('id')
        .eq('clerk_id', userId)
        .maybeSingle();

      if (existing) {
        return NextResponse.json(
          { error: 'Você já tem um cadastro de fornecedor' },
          { status: 400 }
        );
      }

      // Criar fornecedor vinculado ao clerk_id
      const { data: supplier, error: supplierError } = await supabase
        .from('equipment_suppliers')
        .insert([
          {
            clerk_id: userId,
            company_name,
            contact_name,
            email,
            phone,
            equipment_types,
            pricing: pricing || {},
            notes: notes || null,
            status: 'active',
          },
        ])
        .select()
        .single();

      if (supplierError) {
        console.error('Erro ao criar fornecedor:', supplierError);
        throw supplierError;
      }

      // TODO: Enviar email de confirmação para fornecedor
      // await sendSupplierConfirmationEmail(supplier);

      return NextResponse.json({
        success: true,
        message: 'Fornecedor cadastrado com sucesso',
        supplier: {
          id: supplier.id,
          company_name: supplier.company_name,
          email: supplier.email,
        },
      });
    }

    // ========================================
    // CLIENTE - Solicitação de evento (código original)
    // ========================================
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

    // Tentar obter userId se usuário estiver autenticado (opcional)
    let userId: string | null = null;
    try {
      const authResult = await auth();
      userId = authResult.userId;
    } catch {
      // Usuário não autenticado - tudo bem, é API pública
    }

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

          // Criador (se autenticado)
          created_by: userId,

          // ✅ CORRIGIDO: Salvar demanda original do cliente nos campos JSONB
          professionals_needed: professionals || [],
          equipment_needed: equipment_types || [],

          // Metadados da solicitação pública
          internal_notes: `Solicitação pública recebida via formulário do site.\n\nObservações sobre equipamentos: ${equipment_notes || 'Nenhuma'}\n\nObservações adicionais: ${additional_notes || 'Nenhuma'}`,
        },
      ])
      .select()
      .single();

    if (projectError) {
      throw projectError;
    }


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
        } else {
        }

        if (adminResult.success) {
        } else {
        }
      })
      .catch((error) => {
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
