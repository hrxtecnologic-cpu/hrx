import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  sendEventRequestClientConfirmation,
  sendEventRequestAdminNotification,
  sendSupplierConfirmation,
} from '@/lib/resend/emails';
import { rateLimit, RateLimitPresets, createRateLimitError } from '@/lib/rate-limit';
import { publicEventRequestSchema } from '@/lib/validations/event-project';
import { z } from 'zod';

/**
 * API PÚBLICA para receber:
 * - Solicitações de eventos de clientes (request_type: 'client')
 * - Cadastros de fornecedores (request_type: 'supplier')
 * Endpoint: POST /api/public/event-requests
 */
export async function POST(req: Request) {
  try {
    // Rate limiting por IP (20 requisições por minuto)
    const ip = req.headers.get('x-forwarded-for') ||
               req.headers.get('x-real-ip') ||
               'unknown';

    const rateLimitResult = await rateLimit(ip, RateLimitPresets.PUBLIC_API);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        createRateLimitError(rateLimitResult),
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(rateLimitResult.reset).toISOString(),
            'Retry-After': Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    const body = await req.json();

    // Validar dados com Zod
    try {
      const validatedData = publicEventRequestSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Dados inválidos', details: error.issues },
          { status: 400 }
        );
      }
    }

    const { request_type } = body;

    // ========================================
    // FORNECEDOR - Cadastro de empresa fornecedora
    // ========================================
    if (request_type === 'supplier') {
      const {
        company_name,
        legal_name,
        cnpj,
        contact_name,
        email,
        phone,
        equipment_catalog,
        notes,
        // Campos de localização
        latitude,
        longitude,
        address,
        city,
        state,
        zip_code,
      } = body;

      // Validações
      if (!company_name || !contact_name || !email || !phone) {
        return NextResponse.json(
          { error: 'Dados da empresa são obrigatórios (nome, contato, email, telefone)' },
          { status: 400 }
        );
      }

      if (!equipment_catalog || equipment_catalog.length === 0) {
        return NextResponse.json(
          { error: 'Adicione pelo menos um item ao catálogo de equipamentos' },
          { status: 400 }
        );
      }

      // Extrair equipment_types automaticamente do catálogo
      const equipment_types = [...new Set(equipment_catalog.map((item: any) => item.category))];

      const supabase = await createClient();

      // Verificar autenticação (obrigatório para fornecedor)
      const authResult = await auth();
      const userId = authResult.userId;

      if (!userId) {
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
            legal_name: legal_name || null,
            cnpj: cnpj || null,
            contact_name,
            email,
            phone,
            equipment_types,
            equipment_catalog: equipment_catalog || [],
            notes: notes || null,
            status: 'active',
            // Campos de localização
            latitude: latitude || null,
            longitude: longitude || null,
            address: address || null,
            city: city || null,
            state: state || null,
            zip_code: zip_code || null,
          },
        ])
        .select()
        .single();

      if (supplierError) {
        throw supplierError;
      }

      // Enviar email de confirmação para fornecedor
      const catalogPreview = equipment_catalog.slice(0, 5).map((item: any) => ({
        name: item.name,
        category: item.category,
        subcategory: item.subcategory,
      }));

      // Enviar email em background (não bloqueia a resposta)
      sendSupplierConfirmation({
        contactName: contact_name,
        companyName: company_name,
        legalName: legal_name,
        cnpj,
        email,
        phone,
        catalogItemsCount: equipment_catalog.length,
        catalogPreview,
      }).catch(() => {
        // Email silently failed
      });

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
      equipment,
      equipment_types, // Suporte legado (manter por compatibilidade)
      equipment_notes,
      is_urgent,
      budget_range,
      client_budget,
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
          client_budget: client_budget || null,
          additional_notes: additional_notes || null,

          // Criador (se autenticado)
          created_by: userId,

          // ✅ CORRIGIDO: Salvar demanda original do cliente nos campos JSONB
          professionals_needed: professionals || [],
          equipment_needed: equipment || equipment_types || [], // Prioriza 'equipment' do wizard, fallback para 'equipment_types' legado

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
        equipmentCount: (equipment || equipment_types)?.length || 0,
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
        equipmentTypes: equipment || equipment_types || [],
        equipmentNotes: equipment_notes,
        isUrgent: is_urgent,
        budgetRange: budget_range,
        additionalNotes: additional_notes,
      }),
    ]).catch(() => {
        // Emails silently failed
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

    // Se for erro de coluna não existir, retornar mensagem específica
    if (error.message?.includes('column') && error.message?.includes('does not exist')) {
      return NextResponse.json(
        {
          error: 'Estrutura do banco de dados desatualizada. Execute a migration 036.',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        },
        { status: 503 }
      );
    }

    // Se for erro de CNPJ duplicado
    if (error.code === '23505' && error.message?.includes('cnpj')) {
      return NextResponse.json(
        { error: 'CNPJ já cadastrado no sistema' },
        { status: 409 }
      );
    }

    // Retornar erro mais detalhado em desenvolvimento
    return NextResponse.json(
      {
        error: 'Erro ao processar sua solicitação. Tente novamente mais tarde.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
