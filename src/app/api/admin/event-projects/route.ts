import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { rateLimit, RateLimitPresets, createRateLimitError } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import {
  CreateEventProjectData,
  EventProjectSummary,
  EventProjectFilters,
  getProfitMargin,
} from '@/types/event-project';
import { sendUrgentProjectAdminEmail } from '@/lib/resend/emails';
import { createEventProjectSchema } from '@/lib/validations/event-project';
import { z } from 'zod';

// Force dynamic route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

import { withAdmin } from '@/lib/api';

// =============================================
// GET /api/admin/event-projects - Listar projetos
// =============================================
export const GET = withAdmin(async (userId: string, req: Request) => {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(userId, RateLimitPresets.API_READ);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        createRateLimitError(rateLimitResult),
        { status: 429 }
      );
    }

    // Parse query params
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const isUrgent = searchParams.get('is_urgent');
    const clientName = searchParams.get('client_name');
    const eventType = searchParams.get('event_type');
    const venueCity = searchParams.get('venue_city');
    const venueState = searchParams.get('venue_state');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');


    // Query otimizada - seleciona apenas campos necessários para listagem
    let query = supabase
      .from('event_projects')
      .select(`
        id,
        project_number,
        client_name,
        event_name,
        event_type,
        event_date,
        venue_city,
        venue_state,
        status,
        is_urgent,
        professionals_needed,
        equipment_needed,
        total_cost,
        total_client_price,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Aplicar filtros
    if (status) {
      query = query.eq('status', status);
    }

    if (isUrgent === 'true') {
      query = query.eq('is_urgent', true);
    } else if (isUrgent === 'false') {
      query = query.eq('is_urgent', false);
    }

    if (clientName) {
      query = query.ilike('client_name', `%${clientName}%`);
    }

    if (eventType) {
      query = query.eq('event_type', eventType);
    }

    if (venueCity) {
      query = query.ilike('venue_city', `%${venueCity}%`);
    }

    if (venueState) {
      query = query.eq('venue_state', venueState);
    }

    const { data, error } = await query;


    if (error) {
      logger.error('Erro ao buscar projetos', error as any, { userId });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Calcular contadores a partir da DEMANDA DO CLIENTE (professionals_needed e equipment_needed)
    const projectsWithCounts = (data || []).map((project: any) => {
      // professionals_needed é array de objetos com 'quantity'
      const professionalsNeeded = Array.isArray(project.professionals_needed)
        ? project.professionals_needed
        : [];

      // Somar quantity de cada profissional solicitado
      const team_count = professionalsNeeded.reduce((sum: number, prof: any) => {
        return sum + (prof.quantity || 0);
      }, 0);

      // equipment_needed é array de objetos com 'quantity'
      const equipmentNeeded = Array.isArray(project.equipment_needed)
        ? project.equipment_needed
        : [];

      // Somar quantity de cada equipamento solicitado
      const equipment_count = equipmentNeeded.reduce((sum: number, equip: any) => {
        return sum + (equip.quantity || 0);
      }, 0);

      return {
        ...project,
        team_count,
        equipment_count,
      };
    });

    logger.info('Projetos listados com sucesso', {
      userId,
      count: projectsWithCounts.length,
      filters: { status, isUrgent, clientName, eventType },
    });

    return NextResponse.json({
      projects: projectsWithCounts,
      total: projectsWithCounts.length,
      limit,
      offset,
    });
  } catch (error: any) {
    logger.error('Erro ao listar projetos', error);
    return NextResponse.json(
      { error: error?.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
});

// =============================================
// POST /api/admin/event-projects - Criar novo projeto
// =============================================
export const POST = withAdmin(async (userId: string, req: Request) => {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(userId, RateLimitPresets.API_WRITE);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        createRateLimitError(rateLimitResult),
        { status: 429 }
      );
    }

    const body: CreateEventProjectData = await req.json();

    // Validar dados com Zod
    try {
      const validatedData = createEventProjectSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Dados inválidos', details: error.issues },
          { status: 400 }
        );
      }
    }

    // Calcular margem de lucro baseado na urgência
    const profitMargin = getProfitMargin(body.is_urgent);

    // Criar projeto
    const { data: project, error: projectError } = await supabase
      .from('event_projects')
      .insert([
        {
          // Cliente
          client_name: body.client_name,
          client_email: body.client_email,
          client_phone: body.client_phone,
          client_company: body.client_company,
          client_cnpj: body.client_cnpj,

          // Evento
          event_name: body.event_name,
          event_type: body.event_type,
          event_description: body.event_description,
          event_date: body.event_date,
          start_time: body.start_time,
          end_time: body.end_time,
          expected_attendance: body.expected_attendance,

          // Localização
          venue_name: body.venue_name,
          venue_address: body.venue_address,
          venue_city: body.venue_city,
          venue_state: body.venue_state,
          venue_zip: body.venue_zip,

          // Business
          is_urgent: body.is_urgent,
          profit_margin: profitMargin,
          budget_range: body.budget_range,
          client_budget: body.client_budget,

          // Observações
          additional_notes: body.additional_notes,
          internal_notes: body.internal_notes,

          // Metadados
          created_by: userId,
          status: 'new',
        },
      ])
      .select()
      .single();

    if (projectError) {
      logger.error('Erro ao criar projeto', projectError as any, { userId });
      return NextResponse.json({ error: projectError.message }, { status: 500 });
    }

    logger.info('Projeto criado com sucesso', {
      userId,
      projectId: project.id,
      projectNumber: project.project_number,
      isUrgent: body.is_urgent,
    });

    // Criar membros da equipe
    if (body.team && body.team.length > 0) {
      const teamMembers = body.team.map((member) => ({
        project_id: project.id,
        professional_id: member.professional_id,
        external_name: member.external_name,
        role: member.role,
        category: member.category,
        subcategory: member.subcategory,
        quantity: member.quantity,
        duration_days: member.duration_days,
        daily_rate: member.daily_rate,
        notes: member.notes,
        status: 'planned',
      }));

      const { error: teamError } = await supabase
        .from('project_team')
        .insert(teamMembers);

      if (teamError) {
        logger.error('Erro ao criar equipe do projeto', teamError as any, {
          projectId: project.id,
        });
      } else {
        logger.info('Equipe adicionada ao projeto', {
          projectId: project.id,
          teamCount: teamMembers.length,
        });
      }
    }

    // Criar equipamentos
    if (body.equipment && body.equipment.length > 0) {
      const equipment = body.equipment.map((item) => ({
        project_id: project.id,
        equipment_type: item.equipment_type,
        category: item.category,
        subcategory: item.subcategory,
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        duration_days: item.duration_days,
        specifications: item.specifications || {},
        notes: item.notes,
        status: 'requested',
      }));

      const { error: equipmentError } = await supabase
        .from('project_equipment')
        .insert(equipment);

      if (equipmentError) {
        logger.error('Erro ao criar equipamentos do projeto', equipmentError as any, {
          projectId: project.id,
        });
      } else {
        logger.info('Equipamentos adicionados ao projeto', {
          projectId: project.id,
          equipmentCount: equipment.length,
        });
      }
    }

    // Se for URGENTE, enviar email imediato para admin
    if (body.is_urgent) {
      logger.info('Projeto URGENTE criado! Enviando email para admin...', {
        projectId: project.id,
      });

      try {
        await sendUrgentProjectAdminEmail({
          projectId: project.id,
          projectNumber: project.project_number,
          clientName: body.client_name,
          eventName: body.event_name,
          eventDate: body.event_date || 'Não definida',
          eventType: body.event_type,
          venueAddress: `${body.venue_address}, ${body.venue_city} - ${body.venue_state}`,
          profitMargin: profitMargin,
          teamCount: body.team?.length || 0,
          equipmentCount: body.equipment?.length || 0,
        });

        logger.info('Email urgente enviado ao admin', { projectId: project.id });
      } catch (emailError: any) {
        logger.error('Erro ao enviar email urgente', emailError, {
          projectId: project.id,
        });
        // Não falhar o request se email falhar
      }
    }

    return NextResponse.json(
      {
        success: true,
        project: project,
      },
      { status: 201 }
    );
  } catch (error: any) {
    logger.error('Erro ao criar projeto', error);
    return NextResponse.json(
      { error: error?.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
});
